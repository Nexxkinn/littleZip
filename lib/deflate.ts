import { deflateRaw, inflateRaw } from 'https://esm.sh/pako';

export function deflate(data:Uint8Array) {
    return deflateRaw(data) || new Uint8Array();
}

export function inflate(data:Uint8Array) {
    const output = inflateRaw(data);
    if (!output) return new Uint8Array();
    if (typeof output === 'string') return new TextEncoder().encode(output);
    else return output;
}