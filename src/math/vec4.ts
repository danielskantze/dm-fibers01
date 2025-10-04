import type { Vec3, Vec4 } from "./types";

export function create(a: [number, number, number, number]): Vec4 {
  return a;
}

export function fromVec3(vec3: Vec3, pad: number = 0.0): Vec4 {
  return [...vec3, pad];
}