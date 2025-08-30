type Uniform = {
    slot: number;
    location: WebGLUniformLocation;
}

type Uniforms = Record<string, Uniform>;

export type { Uniform, Uniforms };