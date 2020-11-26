import { getfile_args } from "./_deps.ts";

export async function extract(args:getfile_args) {
    const {index,offset,c_size,u_size,file,is_compressed} = args;
    const c_file = new Uint8Array(c_size);
    file.seekSync(offset,Deno.SeekMode.Start);
    file.readSync(c_file);
}