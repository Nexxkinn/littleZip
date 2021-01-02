import { get_entries, compress, create_zip, open_zip } from "./mod.ts";

// // compression
const zip = await compress('test/', 'test.zip');

//extract. functional, but under development.
const file = await Deno.open('test.zip');
await Deno.mkdir('result');

for (const { filename, index, extract } of get_entries(file)) {
    const file = await Deno.create('result/' + filename);
    const content = await extract();
    file.writeSync(content);
}

// increment file compression
const test = await create_zip('test.zip');
await test.push(new TextEncoder().encode('Hello World'), 'hello.txt');
await test.close();

// edit file
const {insert, entries, close} = await open_zip('test copy.zip');
console.log(entries());
await insert('icon3.png',await Deno.open('icon.png'));
console.log(entries());
await close();