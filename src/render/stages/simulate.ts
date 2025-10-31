import { createQuad } from "../../gl/buffers";
import { createFrameBuffer, getFramebufferAttachment } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import * as mat43 from "../../math/mat43";
import type { Vec3, Vec4 } from "../../math/types";
import * as vec3 from "../../math/vec3";
import * as vec4 from "../../math/vec4";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import type { Texture } from "../../types/gl/textures";
import {
  isParameterUniform,
  type FloatUniform,
  type Mat43Uniform,
  type TextureUniform,
  type Uniform,
  type Vec4Uniform,
} from "../../types/gl/uniforms";
import type {
  BufferedStageOutput,
  Resources,
  Stage,
  StageOutput,
} from "../../types/stage";
import fShaderSource from "../shaders/simulate.fs.glsl?raw";
import vShaderSource from "../shaders/texture_quad.vs.glsl?raw";
import { filterType } from "../util/dict";

function loadShaders(gl: WebGL2RenderingContext): ShaderPrograms {
  return {
    shader: assembleProgram(gl, vShaderSource, fShaderSource, program => {
      const positionLocation = gl.getUniformLocation(program, "u_position_texture");
      const colorLocation = gl.getUniformLocation(program, "u_color_texture");
      const propertiesLocation = gl.getUniformLocation(program, "u_properties_texture");

      const particlesTextureSizeLocation = gl.getUniformLocation(
        program,
        "u_particles_texture_size"
      );
      const screenSizeLocation = gl.getUniformLocation(program, "u_screen_size");
      const frameLocation = gl.getUniformLocation(program, "u_frame");
      const randomSeedLocation = gl.getUniformLocation(program, "u_rnd_seed");

      const maxRadiusPLocation = gl.getUniformLocation(program, "u_max_radius");
      const strokeNoisePLocation = gl.getUniformLocation(program, "u_stroke_noise_p");
      const strokeDriftPLocation = gl.getUniformLocation(program, "u_stroke_drift_p");
      const colorNoisePLocation = gl.getUniformLocation(program, "u_color_noise_p");
      const cosPaletteLocation = gl.getUniformLocation(program, "u_cos_palette");

      const audioLevelStatsLocation = gl.getUniformLocation(
        program,
        "u_audio_level_stats"
      );

      const attributes = {
        position: gl.getAttribLocation(program, "position"),
      };
      const uniforms = {
        positionTex: {
          type: "tex2d",
          location: positionLocation,
          slot: 0,
        } as TextureUniform,
        colorTex: {
          type: "tex2d",
          location: colorLocation,
          slot: 1,
        } as TextureUniform,
        propertiesTex: {
          type: "tex2d",
          location: propertiesLocation,
          slot: 2,
        } as TextureUniform,
        particlesTextureSize: {
          location: particlesTextureSizeLocation,
        },
        screenSize: {
          location: screenSizeLocation,
        },
        frame: {
          location: frameLocation,
        },
        randomSeed: {
          location: randomSeedLocation,
          domain: {
            min: Number.NEGATIVE_INFINITY,
            max: Number.POSITIVE_INFINITY,
          },
          value: vec3.create([0, 0, 0]),
          type: "vec3",
        } as Uniform,
        strokeNoise: {
          location: strokeNoisePLocation,
          domain: {
            min: -5.0,
            max: 5.0,
          },
          ui: {
            name: "Stroke Noise",
          },
          value: vec4.create([0.5, 0.1, 1.55, 0.33]),
          type: "vec4",
        } as Vec4Uniform,
        strokeDrift: {
          location: strokeDriftPLocation,
          domain: {
            min: -1.0,
            max: 1.0,
          },
          ui: {
            name: "Stroke Drift",
          },
          value: vec4.create([0.03, 0.01, 0.1, 0.1]),
          type: "vec4",
        } as Vec4Uniform,
        colorNoise: {
          location: colorNoisePLocation,
          domain: {
            min: 0.0,
            max: 1.0,
          },
          ui: {
            name: "Color Noise & Drift",
          },
          value: vec4.create([0.1, 0.1, 0.001, 0.05]),
          type: "vec4",
        } as Vec4Uniform,
        cosPalette: {
          location: cosPaletteLocation,
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
        } as Mat43Uniform,
        maxRadius: {
          location: maxRadiusPLocation,
          domain: {
            min: 0.5,
            max: 50.0,
          },
          ui: {
            name: "Radius",
          },
          value: 2.0,
          type: "float",
        } as FloatUniform,
        audioLevelStats: {
          location: audioLevelStatsLocation,
          value: vec4.createZero(),
          domain: {
            min: Number.NEGATIVE_INFINITY,
            max: Number.POSITIVE_INFINITY,
          },
          type: "vec4",
        } as Vec4Uniform,
      };
      return { program, attributes, uniforms } as ShaderProgram;
    }),
  };
}

// we model the following properties for each particle:

// geometry texture
// - vec4 position (x, y)

// color texture
// - vec4 color (r, g, b, a)

// properties texture
// - float angle
// - float radius
// - float age
// - float lifetime

function createTargetTextures(
  gl: WebGL2RenderingContext,
  width: number,
  height: number
): Texture[] {
  const geometryTexture = createTexture(gl, width, height, "RGBA32F", "geometry", true);
  const colorTexture = createTexture(gl, width, height, "RGBA32F", "color", true);
  const propertiesTexture = createTexture(
    gl,
    width,
    height,
    "RGBA32F",
    "properties",
    true
  );
  const targetTextures = [geometryTexture, colorTexture, propertiesTexture];
  return targetTextures;
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

function getTextureSize(numParticles: number) {
  const width = Math.ceil(Math.sqrt(numParticles));
  return { width, height: width };
}

function reset(gl: WebGL2RenderingContext, stage: Stage) {
  const { output } = stage.resources as Resources & { output: BufferedStageOutput };
  const { framebuffer } = output[0].framebuffer!;
  const clearFloat = new Float32Array([0.0, 0.0, 0.0, 1.0]);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.clearBufferfv(gl.COLOR, 0, clearFloat);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function create(gl: WebGL2RenderingContext, numParticles: number): Stage {
  const shaders = loadShaders(gl);
  const { width, height } = getTextureSize(numParticles);
  const { shader } = shaders;
  const output = [
    createOutput(gl, width, height, "simulate_output_1"),
    createOutput(gl, width, height, "simulate_output_2"),
  ] as BufferedStageOutput;
  const uniforms = shader!.uniforms;
  const parameters = filterType(isParameterUniform, uniforms);
  return {
    name: "simulate",
    resources: {
      buffers: { quad: createQuad(gl) },
      shaders,
      output,
    },
    input: null,
    targets: output[0].textures,
    parameters,
  };
}

// TODO: Clean up textures and framebuffers when resizing

function resize(gl: WebGL2RenderingContext, numParticles: number, stage: Stage) {
  const { width, height } = getTextureSize(numParticles);
  const output = [
    createOutput(gl, width, height, "simulate_output_1"),
    createOutput(gl, width, height, "simulate_output_2"),
  ] as BufferedStageOutput;

  stage.resources.output = output;
}

function draw(
  gl: WebGL2RenderingContext,
  stage: Stage,
  frame: number,
  drawSize?: [number, number]
) {
  const { buffers, shaders, output } = stage.resources as Resources & {
    output: BufferedStageOutput;
  };
  const { shader } = shaders;
  const { quad } = buffers;
  const writeIndex = (frame + 1) % 2;
  const readIndex = frame % 2;
  const targets = output[writeIndex].textures;
  const sources = output[readIndex].textures;
  const framebufferAttachments = Array.from({ length: targets.length }, (_, i) =>
    getFramebufferAttachment(gl, i)
  );
  const framebuffer = output[writeIndex].framebuffer!.framebuffer;
  const u = shader.uniforms;
  const targetSize = drawSize ? drawSize : [targets[0].width, targets[0].height];
  gl.viewport(0, 0, targetSize[0], targetSize[1]); // all targets have the same size
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.disable(gl.BLEND);

  gl.useProgram(shader.program);
  gl.uniform2i(u.particlesTextureSize.location, targetSize[0], targetSize[1]);
  gl.uniform2f(u.screenSize.location, gl.canvas.width, gl.canvas.height);
  gl.uniform1i(u.frame.location, frame);
  gl.uniform1i(u.positionTex.location, (u.positionTex as TextureUniform).slot);
  gl.uniform1i(u.colorTex.location, (u.colorTex as TextureUniform).slot);
  gl.uniform1i(u.propertiesTex.location, (u.propertiesTex as TextureUniform).slot);
  gl.uniform1f(u.maxRadius.location, u.maxRadius.value as number);
  gl.uniform3fv(u.randomSeed.location, u.randomSeed.value as Vec3);
  gl.uniform4fv(u.strokeNoise.location, u.strokeNoise.value as Vec4);
  gl.uniform4fv(u.strokeDrift.location, u.strokeDrift.value as Vec4);
  gl.uniform4fv(u.colorNoise.location, u.colorNoise.value as Vec4);
  gl.uniform4fv(u.audioLevelStats.location, u.audioLevelStats.value as Vec4);

  gl.uniformMatrix4x3fv(u.cosPalette.location, false, u.cosPalette.value as Float32Array);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, sources[0].texture);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, sources[1].texture);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, sources[2].texture);

  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.enableVertexAttribArray(shader.attributes.position);
  gl.vertexAttribPointer(shader.attributes.position, 2, gl.FLOAT, false, 0, 0);
  gl.drawBuffers(framebufferAttachments);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.useProgram(null);

  stage.targets = output[writeIndex].textures;
}

export { create, draw, reset, resize };
