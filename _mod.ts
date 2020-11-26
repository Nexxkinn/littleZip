import { getEntries } from './entries.ts';
const file = await Deno.open('test.zip');
const entries = await getEntries(file);

for (const { filename, index } of entries) {
    console.log({index,filename});
}