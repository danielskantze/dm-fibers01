import type { Matrix4x3, Vec3 } from "./types";
import { clamp as clampScalar } from "./scalar";

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

export function equals(a: Matrix4x3, b: Matrix4x3): boolean {
  for (let i = 0; i < 12; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

export function clamp(value: Matrix4x3, min: Matrix4x3, max: Matrix4x3): Matrix4x3 {
  return create([
    clampScalar(value[0], min[0], max[0]),
    clampScalar(value[1], min[1], max[1]),
    clampScalar(value[2], min[2], max[2]),
    clampScalar(value[3], min[3], max[3]),
    clampScalar(value[4], min[4], max[4]),
    clampScalar(value[5], min[5], max[5]),
    clampScalar(value[6], min[6], max[6]),
    clampScalar(value[7], min[7], max[7]),
    clampScalar(value[8], min[8], max[8]),
    clampScalar(value[9], min[9], max[9]),
    clampScalar(value[10], min[10], max[10]),
    clampScalar(value[11], min[11], max[11]),
  ]);
}

export function clampS(value: Matrix4x3, min: number, max: number): Matrix4x3 {
  return create([
    clampScalar(value[0], min, max),
    clampScalar(value[1], min, max),
    clampScalar(value[2], min, max),
    clampScalar(value[3], min, max),
    clampScalar(value[4], min, max),
    clampScalar(value[5], min, max),
    clampScalar(value[6], min, max),
    clampScalar(value[7], min, max),
    clampScalar(value[8], min, max),
    clampScalar(value[9], min, max),
    clampScalar(value[10], min, max),
    clampScalar(value[11], min, max),
  ]);
}
