import { createQuad } from "../../gl/buffers";
import { createFrameBuffer } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import type { ShaderPrograms } from "../../types/gl/shaders";
import type { Resources, Stage, StageOutput } from "../../types/stage";
import vShaderSource from "../shaders/gradient.vs.glsl?raw";
import fShaderSource from "../shaders/gradient.fs.glsl?raw";

function loadShaders(gl: WebGL2RenderingContext): ShaderPrograms {
  return {
    test: assembleProgram(gl, vShaderSource, fShaderSource, program => {
      const attributes = {
        position: gl.getAttribLocation(program, "position"),
      };
      const uniforms = {};
      return { program, attributes, uniforms };
    }),
  };
}

function create(gl: WebGL2RenderingContext, width: number, height: number): Stage {
  const shaders = loadShaders(gl);
  const targetTexture = createTexture(gl, width, height, "RGBA");
  const framebuffer = createFrameBuffer(gl, width, height, [targetTexture]);
  const output = {
    name: "post_output",
    textures: [targetTexture],
    framebuffer,
  } as StageOutput;
  return {
    name: "test",
    resources: {
      buffers: { quad: createQuad(gl) },
      shaders,
      output,
    },
    input: null,
    targets: [targetTexture],
    parameters: {},
  };
}

function resize(gl: WebGL2RenderingContext, width: number, height: number, stage: Stage) {
  const targetTexture = createTexture(gl, width, height, "RGBA");
  const framebuffer = createFrameBuffer(gl, width, height, [targetTexture]);
  const output = stage.resources.output as StageOutput;
  output.framebuffer = framebuffer;
  stage.targets[0] = targetTexture;
}

function draw(gl: WebGL2RenderingContext, stage: Stage) {
  const { buffers, shaders, output } = stage.resources as Resources & {
    output: StageOutput;
  };
  const { test } = shaders;
  const { quad } = buffers;
  const target = stage.targets[0];
  gl.viewport(0, 0, target.width, target.height);
  gl.useProgram(test.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.enableVertexAttribArray(test.attributes.position);
  gl.vertexAttribPointer(test.attributes.position, 2, gl.FLOAT, false, 0, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, output.framebuffer!.framebuffer);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.useProgram(null);
}

export { create, draw, resize };
