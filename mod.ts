import { append, close } from './lib/compress.ts';
import { lfh_entry } from "./lib/types.ts";
import { join } from './deps.ts';

export { getEntries } from './lib/entries.ts';

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

export async function create_zip(target_path:string){
    const target = await Deno.create(target_path);
    const entries:lfh_entry[] = new Array();
    let offset = 0;
    /**
     * Append file to zip
     * 
     * @param buff file content
     * @param filename file name
     */
    const push = async (buff:Uint8Array,filename:string) => {
        const {len, lfh} = await append({filename,file:buff,zip:target});
        entries.push({offset,lfh});
        offset += len;
    }
    /**
     * close the zip package. call it ONLY at the end of the step.
     */
    const end = async () => {
        await close({lfh_entries:entries,offset,zip:target});
        target.close();
    }

    return { push, end }
}