<h1 align="center">
  <br>
  <img src="icon.png" alt="littlezip">  
  <br>
  <b>littleZip</b>
</h1>

### Features
- memory-friendly
- deflate compression by default
- use few depedencies ( pako and std/join )

### Usage
```ts
import { get_entries, compress, create_zip, open_zip } from 'https://deno.land/x/littlezip@0.4.0/mod.ts'

// read-only single file extraction, currently under development.
const file = await Deno.open('test.zip');
for (const { filename, index, extract } of get_entries(file)) {
    if(index == 100){ // or filename === 'test.jpg'
        const file = await Deno.create('test.jpg');
        const content = await extract();
        file.writeSync(content);
        break;
    }
}

// compress
const zip = await compress('test/','result.zip');

// create a new zip
const zip = await create_zip('path/to/target.zip');
await zip.push(buff1,'file.txt');
await zip.push(buff2,'image.jpg');
await zip.close()   // call this at the end

// edit zip
const zip = await open_zip('path/to/target.zip');
console.log(zip.entries())               // ['test.txt']
await zip.insert(buff2,'filename.jpg');  // ['test.txt', 'filename.jpg'] // push or replace file content
await zip.remove('test.txt');            // ['filename.jpg']
await zip.close(); // call this at the end
```


### Limitation
- No encryption support
- Optimised for simple use case
- No Zip64 support