import type { Uniforms } from "./uniforms";

type ShaderProgram = {
    program: WebGLProgram;
    attributes: Record<string, number>;
    uniforms: Uniforms;
}

type ShaderPrograms = Record<string, ShaderProgram>;

export type { ShaderProgram, ShaderPrograms }; 