import { append_args, close_args, isDenoFile, lfh_entry } from "./types.ts";
import { deflate } from "./deflate/mod.ts";
import { crc32 } from "./crc32.ts";

/**
 * 
 * @param args append args
 * @returns LFH Header & entry size
 */
export async function append(args:append_args):Promise<{len:number,lfh:Uint8Array}>{
    const { filename, file, zip } = args;
    const lfh = new Uint8Array(30+filename.length);

    const content = isDenoFile(file) ? await Deno.readAll(file) : file;
    const crc     = crc32(content);
    const c_content:Uint8Array = deflate(content);

    const lfh_sign = 0x04034b50
    const gen_lfh = () => {
        const dv = new DataView(lfh.buffer);
        dv.setUint32(0,lfh_sign,true);          // lfh sign
        dv.setUint16(4,0x0a,true);              // version
        // skip min_version
        // skip gbpf
        dv.setUint16(8,0x8,true);               // compression method
        // skip file time
        // skip file date
        dv.setUint32(14,crc,true);
        dv.setUint32(18,c_content.length,true)  // compressed size
        dv.setUint32(22,content.length,true)    // uncompressed size
        dv.setUint16(26,filename.length,true)   // filename length
        lfh.set(new TextEncoder().encode(filename),30)  // filename
    }

    gen_lfh();
    zip.writeSync(lfh);
    zip.writeSync(c_content);
    return { len:lfh.length+c_content.length, lfh};
}

export async function close(args:close_args){
    const { lfh_entries, offset:cd_offset, zip } = args;
    const cd_sign   = 0x02014b50;
    const eocd_sign = 0x06054b50;

    let cd_size = 0;

    const gen_CD = ({lfh,offset}:lfh_entry) => {
        const cd = new Uint8Array(lfh.byteLength + 16);
        const dv = new DataView(cd.buffer);

        dv.setUint32(0,cd_sign,true);       // CD sign
        dv.setUint16(4,0x420,true);         // version made by
        cd.set(lfh.slice(4,30),6);          // LFH redudancy
        dv.setUint32(42,offset,true);       // LFH offset
        cd.set(lfh.slice(30),46);           // filename
        cd_size += cd.byteLength;
        return cd;
    }
    for ( const entry of lfh_entries) {
        const cd = gen_CD(entry);
        zip.writeSync(cd);
    }

    const gen_EOCD = () => {
        const eocd = new Uint8Array(22);
        const dv = new DataView(eocd.buffer);

        dv.setUint32(0,eocd_sign,true);             // EOCD sign
        dv.setUint16(8,lfh_entries.length,true);    // Total entries
        dv.setUint16(10,lfh_entries.length,true);   // Total Entries on Disk
        dv.setUint32(12,cd_size, true)              // CD size
        dv.setUint32(16,cd_offset, true)            // CD offset
        return eocd;
    }
    const eocd = gen_EOCD();
    zip.writeSync(eocd);
}
