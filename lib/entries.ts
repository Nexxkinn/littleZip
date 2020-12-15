
import type { Entry, EOCD } from './types.ts';
import { extract as extract_file } from './extract.ts';

export function getEntries(file: Deno.File) {
    const cdh_sign = 0x02014b50;
    const { cd_o, cd_l, entries_l } = getEOCD(file);
    const mem = new Uint8Array(cd_l);

    const read = (o: number = 0) => {
        file.seekSync(o, Deno.SeekMode.Start);
        file.readSync(mem);
    }

    read(cd_o);

    const te = new TextDecoder('utf-8');
    const dv = new DataView(mem.buffer, 0, mem.byteLength);

    let index = 0;
    let entry_index = 0;

    const entries = {
        [Symbol.iterator]() {
            return {
                next: () => {
                    if ( entry_index >= entries_l || dv.getUint32(index, true) !== cdh_sign){
                        const value:Entry = {
                            filename: '',
                            index: entry_index,
                            extract: () => Promise.resolve(new Uint8Array())
                        }
                        return { value, done: true };
                    }
                    // const v      = dv.getUint16(index + 4, true);
                    // const v_min  = dv.getUint16(index + 6, true);
                    // const gpbf   = dv.getUint16(index + 8, true);
                    // const cmprs  = dv.getUint16(index + 10, true);
                    // const m_time = dv.getUint16(index + 12, true);
                    // const m_date = dv.getUint16(index + 14, true);
                    // const crc32  = dv.getUint32(index + 16, true);
                    // const c_size = dv.getUint32(index + 20, true);
                    // const u_size = dv.getUint32(index + 24, true);
                    const name_l = dv.getUint16(index + 28, true);
                    const exf_l  = dv.getUint16(index + 30, true);
                    const cmnt_l = dv.getUint16(index + 32, true);
                    // const disk_i = dv.getUint16(index + 34, true);
                    // const ifa    = dv.getUint16(index + 36, true);
                    // const efa    = dv.getUint32(index + 38, true);
                    const lfh_o  = dv.getUint32(index + 42, true);

                    const curr_index = index;
                    const extract = async () => {
                        file.seekSync(lfh_o,Deno.SeekMode.Start);
                        const content = await extract_file(file);
                        file.seekSync(cd_o,Deno.SeekMode.Start);
                        return content;
                    };

                    const value:Entry = {
                        filename:te.decode(mem.slice(index + 46, index + 46 + name_l)),
                        index: entry_index += 1,
                        extract
                    }
                    index = index + 46 + name_l + exf_l + cmnt_l;
                    return { value, done: false };
                }
            }
        }
    }

    return entries;
}

function getEOCD(file:Deno.File):EOCD {
    // using naive approach;
    const eocd_sign = 0x06054b50;
    const mem  = new Uint8Array(65535);
    const dv   = new DataView(mem.buffer);
    const read = (i:number) => {
        file.seekSync(i,Deno.SeekMode.End);
        file.readSync(mem);
    }
    const parse = (i:number) => {
        // assuming zip file is not corrupted
        const sign    = dv.getUint32(i,true);
        if( sign !== eocd_sign ) throw new Error('file is broken.');
        const disk_l       = dv.getUint16(i+4,true);
        const disk_l_cd    = dv.getUint16(i+6,true);
        const entries_l    = dv.getUint16(i+8,true);
        const entries_l_cd = dv.getUint16(i+10,true);
        const cd_l         = dv.getUint32(i+12,true);
        const cd_o         = dv.getUint32(i+16,true);
        const comment      = dv.getUint16(i+20,true);
        return ({sign, disk_l, disk_l_cd, entries_l, entries_l_cd, cd_l, cd_o, comment});
    }
    read(-22);
    if( dv.getUint32(0,true) === eocd_sign ) return parse(0);
    
    // rare case, might contain comments
    read(-65535);

    let index=0;
    for(let i=0; i < mem.byteLength; i+=4){
        const sign = mem.slice(i,i+4);
        const i_s = sign.indexOf(0x50);
        if(i_s === -1) continue;
        const sign2 = dv.getUint32(i+i_s,true);
        if(sign2 === eocd_sign) { 
            index = i+i_s;
            break;
        }
    }
    return parse(index);
}