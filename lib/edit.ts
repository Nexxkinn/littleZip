import type { lfh_entry } from './types.ts';
import { close as set_footer, append } from './compress.ts';
import { getEOCD } from './eocd.ts';

const td = new TextDecoder('utf-8');

type lfh = lfh_entry & {
    filename: string,
    entry_size: number
}

export async function open_zip(path: string) {
    const target = await Deno.open(path,{write:true,read:true});
    const target_stat = await Deno.stat(path);

    //scan file & get lfh entries
    let { offset, lfh_entries } = await scan_file(target, target_stat);

    // analyse file
    const insert = async (file: Deno.File | Uint8Array, filename: string) => {
        const old_entry = lfh_entries.find(x => x.filename === filename);
        const stat = await Deno.stat(path);

        if (old_entry) {
            const entry_offset = old_entry.offset + old_entry.entry_size;
            const upper_data = new Uint8Array(stat.size-entry_offset);
            await target.seek(entry_offset,Deno.SeekMode.Start);
            await target.read(upper_data);
            await target.seek(old_entry.offset,Deno.SeekMode.Start);
            const {len, lfh} = await append({filename,file,zip:target});
            await target.write(upper_data);
            const new_entry:lfh = {
                offset: entry_offset,
                entry_size:len,
                filename,
                lfh
            }
            // recalibrate all offset above the current one.
            const index = lfh_entries.findIndex(x => x.offset === offset);
            lfh_entries[index] = new_entry;
            lfh_entries.forEach(x => { if(entry_offset < x.offset) x.offset = x.offset + (len - old_entry.entry_size) });
            //console.log(len - old_entry.entry_size);
            offset = offset + (len - old_entry.entry_size);
        }
        else {
            // new entry, I guess?
            await target.seek(offset,Deno.SeekMode.Start);
            const {len, lfh} = await append({filename,file,zip:target});
            lfh_entries.push({offset,filename,entry_size:len,lfh});
            offset += len;
        }
    }

    const remove = async (filename:string) => {
        const entry_index = lfh_entries.findIndex( x => x.filename === filename);
        if(entry_index === -1) return;
        const stat = await Deno.stat(path);
        const { offset: entry_offset, entry_size } = lfh_entries[entry_index];
        const upper_offset = entry_offset + entry_size;
        const upper_data = new Uint8Array(stat.size-upper_offset);
        await target.seek(upper_offset,Deno.SeekMode.Start);
        await target.read(upper_data);
        await target.seek(entry_offset,Deno.SeekMode.Start);
        await target.write(upper_data);
        await Deno.truncate(path,stat.size-entry_size);
        lfh_entries.splice(entry_index,1);
        lfh_entries.forEach(x => { if(entry_offset < x.offset) x.offset = x.offset - entry_size });
        offset = offset - entry_size;
    }

    const entries = () => lfh_entries.map(x => x.filename);

    const close = async () => {
        await target.seek(offset,Deno.SeekMode.Start);
        await set_footer({ lfh_entries, offset, zip: target });
        target.close();
    }

    return { entries, insert, remove, close }
}

async function scan_file(file: Deno.File, stat: Deno.FileInfo): Promise<{ offset: number, lfh_entries: lfh[] }> {
    const lfh_entries: lfh[] = new Array();
    const cd_sign = 0x02014b50;
    const lfh_sign = 0x04034b50;

    const eocd = getEOCD(file);
    let current_offset = 0;
    if (eocd) {
        // read from central directory
        const { cd_o, cd_l, entries_l } = eocd

        const cd_data = new Uint8Array(cd_l);
        const cd_dv   = new DataView(cd_data.buffer, 0, cd_data.byteLength);

        await file.seek(cd_o, Deno.SeekMode.Start);
        await file.read(cd_data);

        let cd_entry_offset = 0;

        let lfh_data = new Uint8Array(4);
        let lfh_dv = new DataView(lfh_data.buffer, 0, lfh_data.byteLength);

        for(let i=0; i < entries_l; i++) {
            if(cd_dv.getUint32(cd_entry_offset, true) !== cd_sign) throw new Error('Failed to scan file: wrong Central Directory signature. ')
            const c_len  = cd_dv.getUint32(cd_entry_offset + 20, true);
            const fn_l   = cd_dv.getUint16(cd_entry_offset + 28, true);
            const ef_l   = cd_dv.getUint16(cd_entry_offset + 30, true);
            const cmnt_l = cd_dv.getUint16(cd_entry_offset + 32, true);
            const lfh_o  = cd_dv.getUint32(cd_entry_offset + 42, true);

            // check lfh
            lfh_data = new Uint8Array(30 + fn_l);
            lfh_dv = new DataView(lfh_data.buffer, 0, lfh_data.byteLength);
            await file.seek(lfh_o, Deno.SeekMode.Start);
            await file.read(lfh_data);
            if (lfh_dv.getUint32(0, true) !== lfh_sign) throw new Error('Failed to scan file: wrong LFH offset from EOCD metada, file might be corrupted.');

            const filename = td.decode(cd_data.slice(cd_entry_offset + 46, cd_entry_offset + 46 + fn_l));
            const entry:lfh = {
                entry_size: 30 + fn_l + ef_l + c_len,
                lfh: lfh_data, 
                offset: lfh_o,
                filename
            }
            lfh_entries.push(entry);
            cd_entry_offset = cd_entry_offset + 46 + fn_l + ef_l + cmnt_l;
        }

        current_offset = cd_o;
    }
    else {
        // read from begining
        let offset = 0;
        const lfh_data = new Uint8Array(30 + 2 ** 16);
        const lfh_dv = new DataView(lfh_data.buffer, 0, lfh_data.byteLength);
        while (offset < stat.size) {
            await file.seek(offset, Deno.SeekMode.Start);
            await file.read(lfh_data);
            if (lfh_dv.getUint32(0, true) !== lfh_sign) throw new Error('Failed to scan file: Wrong initial LFH signature')
            const c_len = lfh_dv.getUint32(18, true); // compressed size
            const fn_l  = lfh_dv.getUint16(26, true); // filename length
            const ef_l  = lfh_dv.getUint16(28, true); // extra field length
            const filename = td.decode(lfh_data.slice(30, 30 + fn_l));

            lfh_entries.push({ offset, filename,  lfh: lfh_data.slice(0, 30 + fn_l + ef_l), entry_size: 30 + fn_l + ef_l + c_len });
            offset = offset + 30 + fn_l + ef_l + c_len;
        }
        current_offset = stat.size;
    }
    return { offset: current_offset, lfh_entries };

}
