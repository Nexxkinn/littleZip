import { getEntries, compress, create_zip } from "./mod.ts";

// // compression
const zip = await compress('test/', 'test.zip');

//extract. functional, but under development.
const file = await Deno.open('test.zip');
await Deno.mkdir('result');

for (const { filename, index, extract } of getEntries(file)) {
    const file = await Deno.create('result/' + filename);
    const content = await extract();
    file.writeSync(content);
}

// increment file compression
const test = await create_zip('test.zip');
await test.push(new TextEncoder().encode('Hello World'), 'hello.txt');
await test.end();
