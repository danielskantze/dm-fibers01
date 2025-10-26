import { createQuad } from "../../gl/buffers";
import { createFrameBuffer } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import type { TextureUniform } from "../../types/gl/uniforms";
import type { Resources, Stage, StageOutput } from "../../types/stage";
import fShaderSource from "../shaders/display.fs.glsl?raw";
import vShaderSource from "../shaders/texture_quad.vs.glsl?raw";

function loadShaders(gl: WebGL2RenderingContext): ShaderPrograms {
  return {
    shader: assembleProgram(gl, vShaderSource, fShaderSource, program => {
      const location = gl.getUniformLocation(program, "tex");
      const attributes = {
        position: gl.getAttribLocation(program, "position"),
      };
      const uniforms = {
        tex: {
          type: "tex2d",
          location,
          slot: 0,
        } as TextureUniform,
      };
      return { program, attributes, uniforms } as ShaderProgram;
    }),
  };
}

function createOutput(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  name: string
) {
  const textures = [createTexture(gl, width, height, "RGBA")];
  const framebuffer = createFrameBuffer(gl, width, height, textures);
  return { name, textures, framebuffer } as StageOutput;
}

function reset(gl: WebGL2RenderingContext, stage: Stage, width: number, height: number) {
  const { output, shaders } = stage.resources as Resources & { output: StageOutput };
  const { shader } = shaders;
  if (output) {
    const { framebuffer } = output.framebuffer!;
    const clearFloat = new Float32Array([0.0, 0.0, 0.0, 1.0]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.clearBufferfv(gl.COLOR, 0, clearFloat);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return;
  }
  gl.useProgram(shader.program);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  draw(gl, stage, width, height);
}

function create(gl: WebGL2RenderingContext, input: Stage, bufferOutput: boolean): Stage {
  const shaders = loadShaders(gl);
  const { width, height } = input.targets[0];
  const output = bufferOutput ? createOutput(gl, width, height, "output") : undefined;

  return {
    name: "output",
    resources: {
      buffers: { quad: createQuad(gl) },
      shaders,
      output,
    },
    input,
    targets: bufferOutput ? output!.textures : [],
    parameters: {},
  };
}

function draw(gl: WebGL2RenderingContext, stage: Stage, width?: number, height?: number) {
  const { buffers, shaders } = stage.resources;
  const { shader } = shaders;
  const { quad } = buffers;
  const { tex } = shader.uniforms;
  const output = stage.resources.output;
  const input = stage.input!;
  const renderWidth = width ?? input.targets[0].width;
  const renderHeight = height ?? input.targets[0].height;
  gl.viewport(0, 0, renderWidth, renderHeight);
  if (output) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, (output as StageOutput).framebuffer.framebuffer);
  }
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.disable(gl.BLEND);

  gl.useProgram(shader.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(tex.location, (tex as TextureUniform).slot);
  gl.bindTexture(gl.TEXTURE_2D, input.targets[0].texture);
  gl.enableVertexAttribArray(shader.attributes.position);
  gl.vertexAttribPointer(shader.attributes.position, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  if (output) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  gl.useProgram(null);
}

export { create, draw, reset };
