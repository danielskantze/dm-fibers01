import type { Vec3 } from "./types";

export function create(a: [
  number, number, number,
  number, number, number,
  number, number, number,
  number, number, number,
]) {
  return new Float32Array(a);
}

export function createFrom(vectors: [
  Vec3, 
  Vec3, 
  Vec3, 
  Vec3
]) {
  return new Float32Array([
    ...vectors[0],
    ...vectors[1],
    ...vectors[2],
    ...vectors[3]
  ]);
}

export function zero() {
  return create([
    0, 0, 0,
    0, 0, 0,
    0, 0, 0,
    0, 0, 0
  ]);
}

