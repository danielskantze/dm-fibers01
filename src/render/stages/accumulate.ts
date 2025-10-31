import { createQuad } from "../../gl/buffers";
import { createFrameBuffer, getFramebufferAttachment } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import type { Texture } from "../../types/gl/textures";
import {
  isPublicUniform,
  type PublicUniform,
  type TextureUniform,
  type Uniform,
} from "../../types/gl/uniforms";
import type {
  BufferedStageOutput,
  Resources,
  Stage,
  StageOutput,
} from "../../types/stage";
import fShaderSource from "../shaders/accumulate.fs.glsl?raw";
import vShaderSource from "../shaders/texture_quad.vs.glsl?raw";
import { filter, filterType } from "../util/dict";

function loadShaders(gl: WebGL2RenderingContext): ShaderPrograms {
  return {
    shader: assembleProgram(gl, vShaderSource, fShaderSource, program => {
      const previousColorLocation = gl.getUniformLocation(program, "previous_color_tex");
      const previousUpdatedLocation = gl.getUniformLocation(
        program,
        "previous_updated_tex"
      );
      const stampColorLocation = gl.getUniformLocation(program, "stamp_color_tex");
      const stampUpdatedLocation = gl.getUniformLocation(program, "stamp_updated_tex");
      const frameLocation = gl.getUniformLocation(program, "u_frame");
      const fadeTimeLocation = gl.getUniformLocation(program, "u_fade_time");
      const accumulateLocation = gl.getUniformLocation(program, "u_accumulate");
      const attributes = {
        position: gl.getAttribLocation(program, "position"),
      };
      const uniforms = {
        previousColorTexture: {
          type: "tex2d",
          location: previousColorLocation,
          slot: 0,
        } as TextureUniform,
        previousUpdatedTexture: {
          type: "tex2d",
          location: previousUpdatedLocation,
          slot: 1,
        } as TextureUniform,
        stampColorTexture: {
          type: "tex2d",
          location: stampColorLocation,
          slot: 2,
        } as TextureUniform,
        stampUpdatedTexture: {
          type: "tex2d",
          location: stampUpdatedLocation,
          slot: 3,
        } as TextureUniform,
        frame: {
          location: frameLocation,
        },
        fadeTime: {
          location: fadeTimeLocation,
          domain: {
            min: 0.1,
            max: 30.0,
          },
          ui: {
            name: "Fade time",
          },
          value: 5.0,
          type: "float",
        } as PublicUniform,
        accumulate: {
          location: accumulateLocation,
          domain: {
            name: "Accumulate",
            min: 0,
            max: 1,
            step: 1,
            type: "enum",
            options: ["no", "yes"],
          },
          value: 1,
          type: "int",
        } as PublicUniform,
      };
      return { program, attributes, uniforms } as ShaderProgram;
    }),
  };
}

function createTargetTextures(
  gl: WebGL2RenderingContext,
  width: number,
  height: number
): Texture[] {
  return [
    createTexture(gl, width, height, "RGBA16F"),
    createTexture(gl, width, height, "R32I", "updated_frame", true),
  ];
}

function createOutput(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  name: string
) {
  const textures = createTargetTextures(gl, width, height);
  const framebuffer = createFrameBuffer(gl, width, height, textures);
  return { name, textures, framebuffer } as StageOutput;
}

function create(gl: WebGL2RenderingContext, input: Stage): Stage {
  const shaders = loadShaders(gl);
  const { width, height } = input.targets[0];

  const output = [
    createOutput(gl, width, height, "accumulate_output_1"),
    createOutput(gl, width, height, "accumulate_output_2"),
  ] as BufferedStageOutput;

  const uniforms = shaders.shader!.uniforms;
  const parameters = filterType(isPublicUniform, uniforms);
  return {
    name: "accumulate",
    resources: {
      buffers: { quad: createQuad(gl) },
      shaders,
      output,
    },
    input,
    targets: output[0].textures,
    parameters,
  };
}

function reset(gl: WebGL2RenderingContext, stage: Stage) {
  const { output } = stage.resources as { output: BufferedStageOutput };
  const clearColor = new Float32Array([0.0, 0.0, 0.0, 0.0]);
  const clearInt = new Int32Array([0, 0, 0, 0]);

  for (const out of output) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, out.framebuffer!.framebuffer);
    gl.clearBufferfv(gl.COLOR, 0, clearColor);
    gl.clearBufferiv(gl.COLOR, 1, clearInt);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function draw(gl: WebGL2RenderingContext, stage: Stage, frame: number) {
  const { buffers, shaders, output } = stage.resources as Resources & {
    output: BufferedStageOutput;
  };
  const { shader } = shaders;
  const { quad } = buffers;
  const u = shader.uniforms;

  const writeIndex = (frame + 1) % 2;
  const readIndex = frame % 2;
  const targets = output[writeIndex].textures;
  const sources = output[readIndex].textures;

  const framebufferAttachments = Array.from({ length: targets.length }, (_, i) =>
    getFramebufferAttachment(gl, i)
  );
  const framebuffer = output[writeIndex].framebuffer!.framebuffer;

  const input = stage.input!;
  gl.viewport(0, 0, input.targets[0].width, input.targets[0].height);
  gl.useProgram(shader.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.uniform1i(
    u.previousColorTexture.location,
    (u.previousColorTexture as TextureUniform).slot
  );
  gl.uniform1i(
    u.previousUpdatedTexture.location,
    (u.previousUpdatedTexture as TextureUniform).slot
  );
  gl.uniform1i(
    u.stampColorTexture.location,
    (u.stampColorTexture as TextureUniform).slot
  );
  gl.uniform1i(
    u.stampUpdatedTexture.location,
    (u.stampUpdatedTexture as TextureUniform).slot
  );
  gl.uniform1i(shader.uniforms.frame.location, frame);
  gl.uniform1f(u.fadeTime.location, u.fadeTime.value as number);
  gl.uniform1i(u.accumulate.location, u.accumulate.value as number);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, sources[0].texture);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, sources[1].texture);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, input.targets[0].texture);
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, input.targets[1].texture);
  gl.enableVertexAttribArray(shader.attributes.position);
  gl.vertexAttribPointer(shader.attributes.position, 2, gl.FLOAT, false, 0, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.drawBuffers(framebufferAttachments);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.useProgram(null);
  stage.targets = targets;
  stage.resources.currentOutput = output[writeIndex];
}

export { create, draw, reset };
