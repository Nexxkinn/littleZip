export function crc32(arr: Uint8Array) {
    let crc = -1, i, j, l, temp, poly = 0xEDB88320;
  
    for (i = 0, l = arr.length; i < l; i += 1) {
      temp = (crc ^ arr[i]) & 0xff;
      for (j = 0; j < 8; j += 1) {
        if ((temp & 1) === 1) {
          temp = (temp >>> 1) ^ poly;
        } else {
          temp = (temp >>> 1);
        }
      }
      crc = (crc >>> 8) ^ temp;
    }

    return crc ^ - 1;
  }