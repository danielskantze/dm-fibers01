import { WebGLShaderError } from "../types/error";
import type { ShaderProgram } from "../types/gl/shaders";

function loadShader(gl: WebGLRenderingContext, type: "vertex" | "fragment", source: string) {
    const shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
    if (!shader) {
        throw new WebGLShaderError('Failed to create shader');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        throw new WebGLShaderError(`Failed to compile shader: ${gl.getShaderInfoLog(shader)}`);
    }
    return shader;
}

function createShaderProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = gl.createProgram();
    if (!program) {
        throw new WebGLShaderError('Failed to create shader program');
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new WebGLShaderError(`Failed to link shader program: ${info}`);
    }
    return program;
}

function assembleProgram(
    gl: WebGLRenderingContext,
    vSource: string,
    fSource: string,
    createFn: (program: WebGLProgram) => ShaderProgram
  ) {
    const program = createShaderProgram(
      gl,
      loadShader(gl, "vertex", vSource),
      loadShader(gl, "fragment", fSource)
    );
    return createFn(program);
  }

export { loadShader, createShaderProgram, assembleProgram };