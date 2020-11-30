export type Entry = {
    index:number;
    filename:string;
    extract():Promise<Uint8Array>;
}
export type extract_args = {
    lfh_offset:number,
    file:Deno.File
}

export type append_args = {
    filename:string,
    file:Deno.File | Uint8Array,
    zip:Deno.File,
}

export function isDenoFile(file:any): file is Deno.File {
    return Boolean(file.rid)
}

export type close_args = {
    lfh_entries:Array<lfh_entry>,
    offset:number,
    zip:Deno.File
}
export type lfh_entry = {
    offset:number,
    lfh:Uint8Array
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