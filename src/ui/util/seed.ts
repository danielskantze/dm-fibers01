import type { Vec3 } from "../../math/types";
import * as vec3 from "../../math/vec3";

/*
    cyrb53 (c) 2018 bryc (github.com/bryc)
    https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
*/

const cyrb53 = (str: string, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for(let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

export function rndSeed(length: number = 12, avg: number = 4) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const numSegments = Math.floor(length / avg);
  const segments = Array.from({length: numSegments}).map(() => (avg));
  const remainder = length - (avg * numSegments);
  for (let i = 0; i < remainder; i++) {
    segments[i] += 1;
  }
  for (let i = 0; i < numSegments; i += 2) {
    if (i >= (numSegments - 2)) {
      break;
    }
    const rnd = Math.round(Math.random());
    if (rnd) {
      segments[i] += 1;
      segments[i + 1] -= 1;
    }
  }
  const words: string[] = segments.map((s) => {
    const letters = Array.from({length: s}).map(() => (chars[Math.floor(Math.random() * chars.length)]));
    return letters.join("") as string;;
  });
  return words.join("-");
}

export function strToVec3(str: string): Vec3 {
  let value = cyrb53(str);
  const parts = vec3.createZero();
  for (let i = 0; i < 3; i++) {
    parts[i] = (value & 0xffff) / 1000.0;
    value = value >> 16;
  }
  return parts;
}