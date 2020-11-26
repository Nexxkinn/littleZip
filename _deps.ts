export type Entry = {
    index:number;
    filename:string;
}
export type getfile_args = {
    index:number,
    offset:number,
    c_size:number,
    u_size:number,
    is_compressed:Boolean,
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