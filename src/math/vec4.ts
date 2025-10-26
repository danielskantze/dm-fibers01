import type { Vec3, Vec4 } from "./types";

export function create(a: [number, number, number, number] | Float32Array): Vec4 {
  return new Float32Array(a);
}

export function fromVec3(vec3: Vec3, pad: number = 0.0): Vec4 {
  const a = new Float32Array(4);
  a[0] = vec3[0];
  a[1] = vec3[1];
  a[2] = vec3[2];
  a[3] = pad;
  return a;
}
