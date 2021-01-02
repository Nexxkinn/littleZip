
import type { Entry, EOCD } from './types.ts';
import { extract as extract_file } from './extract.ts';
import { getEOCD } from './eocd.ts';

export function get_entries(file: Deno.File) {
    const cdh_sign = 0x02014b50;
    const eocd = getEOCD(file);
    if(!eocd) throw new Error('Failed to scan file: unable to read EOCD tag');
    const { cd_o, cd_l, entries_l } = eocd
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