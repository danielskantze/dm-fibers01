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

export type ScalarValueType = "int" | "float" | "enum" | "custom" | "hidden";

export type UniformValue = number | number[] | Float32Array | string;

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

type Uniform = {
  ui?: UniformUI;
  type?: UniformType;
  value?: UniformValue;
  location: WebGLUniformLocation;
};

export interface TextureUniform extends Uniform {
  type: "tex2d";
  slot: number;
}

type Uniforms = Record<string, Uniform>;

export type { Uniform, UniformType, Uniforms };
