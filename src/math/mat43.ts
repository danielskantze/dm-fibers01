import type { Matrix4x3, Vec3 } from "./types";

export function create(
  a: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ]
) {
  return new Float32Array(a);
}

export function copy(a: Float32Array) {
  return new Float32Array(a);
}

export function createFrom(vectors: [Vec3, Vec3, Vec3, Vec3]) {
  return new Float32Array([...vectors[0], ...vectors[1], ...vectors[2], ...vectors[3]]);
}

export function getRow(i: number, m: Matrix4x3): Vec3 {
  return m.subarray(i * 3, (i + 1) * 3);
}

export function setRow(i: number, vec3: Vec3, m: Matrix4x3) {
  m.set(vec3, i * 3);
}

export function zero() {
  return create([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
}
