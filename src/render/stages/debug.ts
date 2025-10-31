import { createQuad } from "../../gl/buffers";
import { createFrameBuffer } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import * as mat43 from "../../math/mat43";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import {
  isPublicUniform,
  type TextureUniform,
  type Uniform,
} from "../../types/gl/uniforms";
import type { Resources, Stage, StageOutput } from "../../types/stage";
import vShaderSource from "../shaders/texture_quad.vs.glsl?raw";
import { filterType } from "../util/dict";

function loadShaders(gl: WebGL2RenderingContext, fShaderSource: string): ShaderPrograms {
  return {
    shader: assembleProgram(gl, vShaderSource, fShaderSource, program => {
      const attributes = {
        position: gl.getAttribLocation(program, "position"),
      };
      const uniforms = {
        tex: {
          type: "tex2d",
          location: gl.getUniformLocation(program, "tex"),
          slot: 0,
        } as TextureUniform,
        cosPalette: {
          location: gl.getUniformLocation(program, "u_cos_palette"),
          type: "mat43",
          value: mat43.createFrom([
            [0.5, 0.5, 0.5],
            [0.5, 0.5, 0.5],
            [1.0, 1.0, 1.0],
            [0.0, 0.9, 0.9],
          ]),
          domain: {
            min: 0.0,
            max: 1.0,
          },
          ui: {
            name: "Palette",
            component: "cos-palette",
          },
        } as Uniform,
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

function reset(gl: WebGL2RenderingContext, stage: Stage) {
  const { output } = stage.resources as Resources & { output: StageOutput };
  if (!output) {
    return;
  }
  const { framebuffer } = output.framebuffer!;
  const clearFloat = new Float32Array([0.0, 0.0, 0.0, 1.0]);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.clearBufferfv(gl.COLOR, 0, clearFloat);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function create(
  gl: WebGL2RenderingContext,
  input: Stage,
  bufferOutput: boolean,
  fShaderSource: string
): Stage {
  const shaders = loadShaders(gl, fShaderSource);
  const { width, height } = input.targets[0];
  const output = bufferOutput ? createOutput(gl, width, height, "output") : undefined;
  const uniforms = shaders.shader.uniforms;
  const parameters = filterType(isPublicUniform, uniforms);
  return {
    name: "debug",
    resources: {
      buffers: { quad: createQuad(gl) },
      shaders,
      output,
    },
    input,
    targets: bufferOutput ? output!.textures : [],
    parameters,
  };
}

function draw(gl: WebGL2RenderingContext, stage: Stage, width?: number, height?: number) {
  const { buffers, shaders } = stage.resources;
  const { shader } = shaders;
  const { quad } = buffers;
  const { tex } = shader.uniforms;
  const u = shader.uniforms;
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
  gl.uniformMatrix4x3fv(u.cosPalette.location, false, u.cosPalette.value as Float32Array);
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
