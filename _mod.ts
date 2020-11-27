import { join } from "https://deno.land/std@0.78.0/path/win32.ts";
import { append, close } from './compress.ts';
import { lfh_entry } from "./types.ts";

export { getEntries } from './entries.ts';


export async function compress(dir_path:string,target_path:string) {
    // create file
    const source = Deno.readDir(dir_path);
    const target = await Deno.create(target_path);
    const entries:lfh_entry[] = new Array();
    let offset = 0;
    for await( const entry of source ) {
        const file = await Deno.open(join(dir_path,entry.name));
        const {len, lfh} = await append({filename:entry.name,file,zip:target})
        entries.push({offset,lfh});
        offset += len;
    }

    await close({lfh_entries:entries,offset,zip:target});
    target.close();
    return target;
}