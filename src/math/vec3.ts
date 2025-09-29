import type { Vec3, Matrix3x3 } from "./types";

function multiplyMatrix(v: Vec3, m: Matrix3x3): Vec3 {
  return [
    v[0] * m[0][0] + v[1] * m[1][0] + v[2] * m[2][0],
    v[0] * m[0][1] + v[1] * m[1][1] + v[2] * m[2][1],
    v[0] * m[0][2] + v[1] * m[1][2] + v[2] * m[2][2]];
}

export function rotateX(vector: Vec3, angle: number): Vec3 {
  const matrix: Matrix3x3 = [
    [1.0, 0.0, 0.0],
    [0, Math.cos(angle), -Math.sin(angle)],
    [0, Math.sin(angle), Math.cos(angle)]
  ];
  return multiplyMatrix(vector, matrix);
}

export function rotateY(vector: Vec3, angle: number): Vec3 {
  const matrix: Matrix3x3 = [
    [Math.cos(angle), 0, Math.sin(angle)],
    [0, 1, 0],
    [-Math.sin(angle), 0, Math.cos(angle)]
  ];
  return multiplyMatrix(vector, matrix);
}

export function rotateZ(vector: Vec3, angle: number): Vec3 {
  const matrix: Matrix3x3 = [
    [Math.cos(angle), -Math.sin(angle), 0],
    [Math.sin(angle), Math.cos(angle), 0],
    [0, 0, 1]
  ];
  return multiplyMatrix(vector, matrix);
}

export function scale(vector: Vec3, scale: number): Vec3 {
  return [vector[0] * scale, vector[1] * scale, vector[2] * scale];
}

export function length(vector: Vec3): number {
  return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2]);
}

export function toPolar(vector: Vec3): Vec3 {
  const rotX = Math.atan2(vector[1], vector[0]);
  const rotZ = Math.asin(vector[2] / length(vector));
  return [ length(vector),  rotX,  rotZ ];
}

export function fromPolar(vector: Vec3): Vec3 {
  return [
    vector[0] * Math.cos(vector[1]) * Math.cos(vector[2]), 
    vector[0] * Math.sin(vector[1]) * Math.cos(vector[2]), 
    vector[0] * Math.sin(vector[2])
  ];
}