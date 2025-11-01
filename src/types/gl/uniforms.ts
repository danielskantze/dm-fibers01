import type { Vec3, Matrix3x3, Matrix4x4, Matrix4x3, Vec4 } from "../../math/types";

type UniformType =
  | "vec4"
  | "vec3"
  | "vec2"
  | "float"
  | "ivec4"
  | "ivec3"
  | "ivec2"
  | "int"
  | "mat4"
  | "mat3"
  | "mat43"
  | "tex2d"
  | "custom";

export const UniformFloatVectorTypes: UniformType[] = [
  "vec2",
  "vec3",
  "vec4",
  "mat3",
  "mat43",
  "mat4",
];

export const UniformFloatTypes: UniformType[] = ["float", ...UniformFloatVectorTypes];

export const UniformIntVectorTypes: UniformType[] = ["ivec2", "ivec3", "ivec4"];

export const UniformIntTypes: UniformType[] = ["int", ...UniformIntVectorTypes];

export const UniformComponents: Record<UniformType, number> = {
  mat4: 16,
  mat43: 12,
  mat3: 9,
  vec4: 4,
  vec3: 3,
  vec2: 2,
  float: 1,
  ivec4: 4,
  ivec3: 3,
  ivec2: 2,
  int: 1,
  tex2d: 1,
  custom: -1,
};

export type ScalarValueType = "int" | "float" | "enum" | "custom";

export type UniformValue = number | number[] | Float32Array | string;

export type UniformValueMap = {
  float: number;
  int: number;
  vec4: Vec4;
  vec3: Vec3;
  vec2: Float32Array;
  ivec4: Int32Array;
  ivec3: Int32Array;
  ivec2: Int32Array;
  mat4: Matrix4x4;
  mat3: Matrix3x3;
  mat43: Matrix4x3;
  tex2d: unknown;
  custom: unknown; // 'unknown' is safer than 'any'
};

export type MappedUniformValue<T extends UniformType> = UniformValueMap[T];

export interface UniformValueDomain {
  min: number;
  max: number;
  step?: number;
  type: ScalarValueType;
  options?: string[];
}

export interface UniformUI extends Partial<UniformValueDomain> {
  name: string;
  component?: string;
}

interface Uniform {
  location: WebGLUniformLocation;
  value?: UniformValue;
  type?: UniformType;
}
interface ParameterUniform extends Uniform {
  domain: UniformValueDomain;
  ui?: UniformUI;
}

export interface FloatUniform extends ParameterUniform {
  type: "float";
  value: number;
}

export function isFloatUniform(uniform: Uniform): uniform is FloatUniform {
  return uniform.type === "float";
}

export interface IntUniform extends ParameterUniform {
  type: "int";
  value: number;
}

export function isIntUniform(uniform: Uniform): uniform is IntUniform {
  return uniform.type === "int";
}

export interface Vec3Uniform extends ParameterUniform {
  type: "vec3";
  value: Vec3;
}

export function isVec3Uniform(uniform: Uniform): uniform is Vec3Uniform {
  return uniform.type === "vec3";
}

export interface Vec4Uniform extends ParameterUniform {
  type: "vec4";
  value: Vec4;
}

export function isVec4Uniform(uniform: Uniform): uniform is Vec4Uniform {
  return uniform.type === "vec4";
}

export interface Mat4Uniform extends ParameterUniform {
  type: "mat4";
  value: Matrix4x4;
}

export function isMat4Uniform(uniform: Uniform): uniform is Mat4Uniform {
  return uniform.type === "mat4";
}

export interface Mat3Uniform extends ParameterUniform {
  type: "mat3";
  value: Matrix3x3;
}

export function isMat3Uniform(uniform: Uniform): uniform is Mat3Uniform {
  return uniform.type === "mat3";
}

export interface Mat43Uniform extends ParameterUniform {
  type: "mat43";
  value: Matrix4x3;
}

export function isMat43Uniform(uniform: Uniform): uniform is Mat43Uniform {
  return uniform.type === "mat43";
}

export function isParameterUniform(uniform: Uniform): uniform is ParameterUniform {
  return (uniform as ParameterUniform).domain !== undefined;
}

export interface TextureUniform extends Uniform {
  type: "tex2d";
  slot: number;
}

type Uniforms = Record<string, Uniform>;

export type { Uniform, ParameterUniform, UniformType, Uniforms };
