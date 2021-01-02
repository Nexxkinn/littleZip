import { EOCD } from "./types.ts";

export function getEOCD(file:Deno.File):EOCD | null {
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
    if (!index) return null;
    return parse(index);
}