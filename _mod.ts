import { getEntries } from './entries.ts';

const file = await Deno.open('test.zip');

for (const { filename, index, extract } of await getEntries(file)) {
    //console.log({filename, index});
    if(index == 100){ 
        const file = Deno.createSync('test.jpg');
        const content = await extract();
        file.writeSync(content);
        break;
    }
}