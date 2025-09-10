type UniformType = 
  "vec4" | "vec3" | "vec2" | "float" |
  "ivec4" | "ivec3" | "ivec2" | "int";

export const UniformComponents: Record<UniformType, number> = {
  vec4: 4,
  vec3: 3,
  vec2: 2,
  float: 1,
  ivec4: 4,
  ivec3: 3,
  ivec2: 2,
  int: 1
};

export type UniformUI = {
  name: string;
  min?: number;
  max?: number;
  step?: number;
}

type Uniform = {
    ui?: UniformUI;
    slot: number;
    type?: UniformType;
    value?: number | number[];
    location: WebGLUniformLocation;
}

type Uniforms = Record<string, Uniform>;

export type { Uniform, UniformType, Uniforms };