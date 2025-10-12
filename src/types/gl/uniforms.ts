type UniformType = 
  "vec4" | "vec3" | "vec2" | "float" |
  "ivec4" | "ivec3" | "ivec2" | "int" | 
  "mat4" | "mat3" | "mat43";

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
  int: 1
};

export type ScalarUIType = "int" | "float" | "enum";

export type UniformUI = {
  name: string;
  min?: number;
  max?: number;
  step?: number;
  component?: string;
  type?: ScalarUIType;
  options?: string[];
}

type Uniform = {
    ui?: UniformUI;
    slot: number;
    type?: UniformType;
    value?: number | number[] | Float32Array;
    location: WebGLUniformLocation;
}

type Uniforms = Record<string, Uniform>;

export type { Uniform, UniformType, Uniforms };