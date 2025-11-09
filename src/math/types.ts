export type Vec3 = [number, number, number] | Float32Array;
export type Vec4 = [number, number, number, number] | Float32Array;
export type Matrix3x3Vec = [Vec3, Vec3, Vec3];
export type Matrix3x3 = Float32Array;
export type Matrix4x4 = Float32Array;
export type Matrix4x3 = Float32Array;
export type BlendFunction<T> = (a: T, b: T) => T;
export type BlendMode = "add" | "multiply" | "overwrite";
export type DomainFunction<T> = (v: T) => T;
export type Range<T> = {
  min: T;
  max: T;
};

export function isVec3(value: any): value is Vec3 {
  return value instanceof Float32Array && value.length === 3;
}

export function isVec3Like(value: any): value is Vec3 {
  return (value instanceof Float32Array || Array.isArray(value)) && value.length === 3;
}

export function isVec4(value: any): value is Vec4 {
  return value instanceof Float32Array && value.length === 4;
}

export function isVec4Like(value: any): value is Vec4 {
  return (value instanceof Float32Array || Array.isArray(value)) && value.length === 4;
}

export function isVec(value: any): value is Vec3 | Vec4 {
  return value instanceof Float32Array && (value.length === 3 || value.length === 4);
}

export function isVecLike(value: any): value is Vec3 | Vec4 {
  return (
    (value instanceof Float32Array || Array.isArray(value)) &&
    (value.length === 3 || value.length === 4)
  );
}
