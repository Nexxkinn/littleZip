import { deflateRaw, inflateRaw } from 'https://esm.sh/pako';

export function deflate(data:Uint8Array) {
    return deflateRaw(data)
}

export function inflate(data:Uint8Array) {
    return inflateRaw(data);
}