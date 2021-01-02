import { inflate } from './deflate.ts';

export async function extract(file:Deno.File) {
    const lfh_mem = new Uint8Array(30);
    const dv = new DataView(lfh_mem.buffer);
    file.readSync(lfh_mem);
    const parse = () => {
        const cmprs = dv.getUint16(8, true); // compression method
        const c_len = dv.getUint32(18,true); // compressed size
        const u_len = dv.getUint32(22,true); // uncompressed size
        const fn_l  = dv.getUint16(26,true); // filename length
        const ef_l  = dv.getUint16(28,true); // extra field length
        const c_offset = fn_l + ef_l    // LFH + extra header ( assume no encryption )
        //console.log(new TextDecoder('utf-8').decode(lfh_mem.slice(30,30+fn_l)))
        return { c_offset,c_len,u_len,cmprs }
    }

    const { c_offset,c_len,u_len,cmprs } = parse();
    const c_file = new Uint8Array(c_len);
    file.seekSync(c_offset,Deno.SeekMode.Current);
    file.readSync(c_file);
    if(c_len === u_len && cmprs === 0x0) {
        return c_file; // file is considered uncompressed.
    } 
    else {
        // check method
        if (cmprs !== 0x8) throw new Error('Unknown compression method:' + cmprs);
        return inflate(c_file)
    }
}