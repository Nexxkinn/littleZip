### Features
- memory-friendly
- deflate compression by default
- use few depedencies ( denoflate and std/join )

### Usage
```ts
import { getEntries, compress } from 'https://deno.land/x/littlezip'
// extract single file
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