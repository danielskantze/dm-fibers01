import type { Vec3, Vec4 } from "./types";
import { clamp as clampScalar } from "./scalar";

export function create(a: [number, number, number, number] | Float32Array): Vec4 {
  return new Float32Array(a);
}

export function createZero(): Vec4 {
  return new Float32Array([0, 0, 0, 0]);
}

export function fromVec3(vec3: Vec3, pad: number = 0.0): Vec4 {
  const a = new Float32Array(4);
  a[0] = vec3[0];
  a[1] = vec3[1];
  a[2] = vec3[2];
  a[3] = pad;
  return a;
}
export function clamp(value: Vec4, min: Vec4, max: Vec4): Vec4 {
  return create([
    clampScalar(value[0], min[0], max[0]),
    clampScalar(value[1], min[1], max[1]),
    clampScalar(value[2], min[2], max[2]),
    clampScalar(value[3], min[3], max[3]),
  ]);
}
export function clampS(value: Vec4, min: number, max: number): Vec4 {
  return create([
    clampScalar(value[0], min, max),
    clampScalar(value[1], min, max),
    clampScalar(value[2], min, max),
    clampScalar(value[3], min, max),
  ]);
}
