import type { Vec3, Matrix3x3, Matrix4x4 } from "./types";

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

export function identity(): Matrix4x4 {
  return [
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.0],
    [0.0, 0.0, 0.0, 1.0],
  ];
}

export function scale(vector: Vec3, scale: number): Vec3 {
  return [

  ];
}