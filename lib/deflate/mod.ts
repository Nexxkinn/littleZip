import { pako } from './deps.ts';

export function deflate(data:Uint8Array) {
    return pako.deflateRaw(data)
}

export function inflate(data:Uint8Array) {
    return pako.inflateRaw(data);
}