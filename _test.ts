import { getEntries, compress } from "./_mod.ts";

// extract, functional, but under development.
const file = await Deno.open('test.zip');
for (const { filename, index, extract } of await getEntries(file)) {
    if(index == 100){ 
        const file = Deno.createSync('test.jpg');
        const content = await extract();
        file.writeSync(content);
        break;
    }
}

// compress
const zip = await compress('test/','result.zip');
