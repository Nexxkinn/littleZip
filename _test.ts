import { getEntries, compress, create_zip } from "./_mod.ts";

//extraction. functional, but under development.
const file = await Deno.open('test.zip');
for (const { filename, index, extract } of await getEntries(file)) {
    if(index == 100){ 
        const file = Deno.createSync('test.jpg');
        const content = await extract();
        file.writeSync(content);
        break;
    }
}

// compression
const zip = await compress('test/','result.zip');

// increment file compression
const test = await create_zip('test.zip');
await test.push(new TextEncoder().encode('Hello World'),'hello.txt');
await test.end();
