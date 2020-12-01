### Features
- memory-friendly
- deflate compression by default
- use few depedencies ( pako and std/join )

### Usage
```ts
import { getEntries, compress, create_zip } from 'https://deno.land/x/littlezip/mod.ts'
// extract single file, currently under development.
const file = await Deno.open('test.zip');
for (const { filename, index, extract } of await getEntries(file)) {
    if(index == 100){ // or filename === 'test.jpg'
        const file = Deno.createSync('test.jpg');
        const content = await extract();
        file.writeSync(content);
        break;
    }
}

// compress
const zip = await compress('test/','result.zip');

// increment file compression
const zip = await create_zip('path/to/target.zip');
await zip.push(buff1,'file.txt');
await zip.push(buff2,'image.jpg');
await zip.end()                     // required to call this method to close the package
```

### Limitation
- No encryption support
- Single-directory, file only.
- Lots of shortcuts and naive approachs
- Optimised only for gallery compression and single file extract.
- Prone to pathfile attack (?)
- Not yet audited. 

### TODO
- [x] compression
- [ ] decompression