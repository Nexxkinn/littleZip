export type Entry = {
    index:number;
    filename:string;
    extract():Promise<Uint8Array>;
}
export type extract_args = {
    lfh_offset:number,
    file:Deno.File
}

export type EOCD = {
    sign:number,
    disk_l:number,
    disk_l_cd:number,
    entries_l:number,
    entries_l_cd:number,
    cd_l:number,
    cd_o:number,
    comment:number
}