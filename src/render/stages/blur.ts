import { createQuad } from "../../gl/buffers";
import { createFrameBuffer } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import { type BlurQuality } from "../../types/settings";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import type { Resources, Stage, StageOutput, TypedResources } from "../../types/stage";
import fBlurShaderSource from "../shaders/blur.fs.glsl?raw";
import vShaderSource from "../shaders/texture_quad.vs.glsl?raw";
import fWeightedShaderSource from "../shaders/weighted.fs.glsl?raw";
import fDownsampleShaderSource from "../shaders/downsample.fs.glsl?raw";

type BlurStageInternalData = {
  layers: [StageOutput, StageOutput][];
  quality: BlurQuality;
};

type BlurStage = Stage<BlurStageInternalData>;

function loadShaders(gl: WebGL2RenderingContext): ShaderPrograms {
    return {
        blur: assembleProgram(gl, vShaderSource, fBlurShaderSource, (program) => {
            const attributes = {
                position: gl.getAttribLocation(program, "position"),
            };
            const uniforms = {
                texture: {
                  location: gl.getUniformLocation(program, "tex"),
                  slot: 0,
                },
                textureSize: {
                  location: gl.getUniformLocation(program, "texture_size"),
                  slot: 1
                },
                direction: {
                  location: gl.getUniformLocation(program, "direction"),
                  slot: 2
                }
            };
            return { program, attributes, uniforms } as ShaderProgram;
        }),
        // TODO: Finish add shader: load correct fragment shader source
        // TODO: Finish add shader: hook up draw calls correctly below, replace second blit-block
        add: assembleProgram(gl, vShaderSource, fWeightedShaderSource, (program) => {
            const attributes = {
                position: gl.getAttribLocation(program, "position"),
            };
            const uniforms = {
                texture: {
                  location: gl.getUniformLocation(program, "tex"),
                  slot: 0,
                },
                weight: {
                  location: gl.getUniformLocation(program, "u_weight"),
                  slot: 1
                },
                sourceResolution: {
                  location: gl.getUniformLocation(program, "u_source_resolution"),
                  slot: 2
                }
            };
            return { program, attributes, uniforms } as ShaderProgram;
        }),
        downsample: assembleProgram(gl, vShaderSource, fDownsampleShaderSource, (program) => {
          const attributes = {
              position: gl.getAttribLocation(program, "position"),
          };
          const uniforms = {
              texture: {
                location: gl.getUniformLocation(program, "tex"),
                slot: 0,
              },
              sourceResolution: {
                location: gl.getUniformLocation(program, "u_source_resolution"),
                slot: 1
              }
          };
          return { program, attributes, uniforms } as ShaderProgram;
      }),
    };
}

function createOutput(gl: WebGL2RenderingContext, width: number, height: number, name: string) {
    const textures = [createTexture(gl, width, height, "RGBA16F")];
    const framebuffer = createFrameBuffer(gl, width, height, textures);
    return { name, textures, framebuffer} as StageOutput;
}

function copyStageOutput(gl: WebGL2RenderingContext, src: StageOutput, dest: StageOutput) {
  const srcSize = [src.textures[0].width, src.textures[0].height];
  const destSize = [dest.textures[0].width, dest.textures[0].height];
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, src.framebuffer.framebuffer);
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dest.framebuffer.framebuffer);
  gl.blitFramebuffer(
    0, 0, srcSize[0], srcSize[1],
    0, 0, destSize[0], destSize[1],
    gl.COLOR_BUFFER_BIT,
    gl.LINEAR
  );
}

function createDownsamplePass(program: ShaderProgram, quad: WebGLBuffer) {
  let u = program.uniforms;
  return {
    start: (gl: WebGL2RenderingContext) => {
      gl.useProgram(program.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(program.attributes.position);
      gl.vertexAttribPointer(program.attributes.position, 2, gl.FLOAT, false, 0, 0);
      gl.disable(gl.BLEND);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(u.texture.location, u.texture.slot);
    },
    render: (gl: WebGL2RenderingContext, src: StageOutput, dest: StageOutput) => {
      const { framebuffer } = dest;
      gl.viewport(0, 0, framebuffer.width, framebuffer.height);
      gl.bindTexture(gl.TEXTURE_2D, src.textures[0].texture);
      gl.uniform2f(u.sourceResolution.location, src.textures[0].width, src.textures[0].height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.framebuffer);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindTexture(gl.TEXTURE_2D, null);
    },
    cleanup: (gl: WebGL2RenderingContext) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(null);
    }
  }
}

function createAddPass(program: ShaderProgram, quad: WebGLBuffer) {
  let u = program.uniforms;
  return {
    start: (gl: WebGL2RenderingContext) => {
      gl.useProgram(program.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(program.attributes.position);
      gl.vertexAttribPointer(program.attributes.position, 2, gl.FLOAT, false, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(u.texture.location, u.texture.slot);
    },
    render: (gl: WebGL2RenderingContext, src: StageOutput, dest: StageOutput, weight: number) => {
      const { framebuffer } = dest;
      gl.viewport(0, 0, framebuffer.width, framebuffer.height);
      gl.bindTexture(gl.TEXTURE_2D, src.textures[0].texture);
      gl.uniform1f(u.weight.location, weight);
      gl.uniform2f(u.sourceResolution.location, src.textures[0].width, src.textures[0].height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.framebuffer);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindTexture(gl.TEXTURE_2D, null);
    },
    cleanup: (gl: WebGL2RenderingContext) => {
      gl.disable(gl.BLEND);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(null);
    }
  }
}

function createBlurPass(program: ShaderProgram, quad: WebGLBuffer) {
let u = program.uniforms;
  return {
    start: (gl: WebGL2RenderingContext) => {
      gl.disable(gl.BLEND);
      gl.useProgram(program.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(program.attributes.position);
      gl.vertexAttribPointer(program.attributes.position, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(u.texture.location, u.texture.slot);
    },
    render: (gl: WebGL2RenderingContext, src: StageOutput, dest: StageOutput, direction: [number, number]) => {
      const { framebuffer } = dest;
      const outputSize = [framebuffer.width, framebuffer.height]; 
      gl.viewport(0, 0, outputSize[0], outputSize[1]);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindTexture(gl.TEXTURE_2D, src.textures[0].texture);
      gl.uniform2fv(u.textureSize.location, outputSize);
      gl.uniform2fv(u.direction.location, direction);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.framebuffer);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, null);
    },
    cleanup: (gl: WebGL2RenderingContext) => {
      gl.disable(gl.BLEND);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(null);
    }
  }
}

function seq(length: number): number[] {
  return Array.from({length});
}

function create(gl: WebGL2RenderingContext, input: Stage, quality: BlurQuality, steps: number): Stage {
    const shaders = loadShaders(gl);
    const { width, height } = input.targets[0];
    const numSteps = steps;

    const layers: [StageOutput, StageOutput][] = seq(numSteps)
      .map((_, i) => ([
        createOutput(gl, width >> i, height >> i, `blur_a_${i}`),
        createOutput(gl, width >> i, height >> i, `blur_b_${i}`)
      ]));

    const output = createOutput(gl, width, height, "motionblur_output_1");

    const stage: BlurStage = {
        name: "blur",
        resources: {
            buffers: { quad: createQuad(gl) },
            shaders,
            output,
            internal: { layers, quality }
        },
        input,
        targets: output.textures,
        parameters: [],
    }
    return stage;
}

function draw(gl: WebGL2RenderingContext, stage: Stage, mix?: number) {
    const resources = stage.resources as TypedResources<BlurStageInternalData>;
    const { buffers, shaders, output } = resources as Resources & { output: StageOutput };
    const { layers, quality } = resources.internal;
    const { quad } = buffers;
    const input = stage.input!.resources.currentOutput! as StageOutput;

    const minBlurRadius = 1.0;
    const maxBlurRadius = 1.5;

    const blurPass = createBlurPass(shaders.blur, quad);
    const addPass = createAddPass(shaders.add, quad);
    
    // Copy and downsample
    if (quality === "high") {
      const downsamplePass = createDownsamplePass(shaders.downsample, quad);
      downsamplePass.start(gl);
      for (let i = 0, src = input; i < layers.length; src = layers[i][0], i++) {
        downsamplePass.render(gl, src, layers[i][0]);
      }
      downsamplePass.cleanup(gl);
    } else {
      for (let i = 0, src = input; i < layers.length; src = layers[i][0], i++) {
        copyStageOutput(gl, src, layers[i][0]);
      }
    }

    // layers[i][0], a.k.a. a now contains downsampled versions

    // Blur downsampled textures, using separable gaussian blur
    blurPass.start(gl);
    for (let i = layers.length - 1; i >= 0; i--) {
      // Interpolate the blur radius based on the current layer.
      const t = i / (layers.length - 1);
      const blurRadius = minBlurRadius + t * (maxBlurRadius - minBlurRadius);

      const [a, b] = layers[i];
      blurPass.render(gl, a, b, [blurRadius, 0.0]);
      blurPass.render(gl, b, a, [0.0, blurRadius]);
    }
    blurPass.cleanup(gl);

    // layers[i][0], a.k.a. a now contains blurred downsampled versions
    // Incrementally add downsampled textures together
    addPass.start(gl);
    
    // Define the weights for each accumulation step, from the blurriest layer to the sharpest.
    // This provides a more direct and intuitive way to control the bloom's falloff
    // than a procedural calculation, while maintaining the performance of the iterative approach.
    // A smaller final weight de-emphasizes the sharpest, innermost layer.
    
    const stepWeights = seq(layers.length - 1).map((_, i, a) => {
      const p = 1.0 - i / (a.length - 1); 
      return 1.0 - 0.5 * p * p * p * p;
    });

    for (let i = layers.length - 1; i > 0; i--) {
      // The step weight index is i-1, corresponding to the blur layer being processed.
      // E.g., when i=4 (smallest layer), we use weight at index 3.
      const weight = stepWeights[i - 1];
      addPass.render(gl, layers[i][0], layers[i - 1][0], weight);
    }
    // Fill the output buffer depending on mix (undefined means no mix and we are done)
    copyStageOutput(gl, !mix ? layers[0][0] : input, output);
    addPass.cleanup(gl);
    if (mix) {  
      addPass.start(gl);
      addPass.render(gl, layers[0][0], output, 1.0 - mix);
      addPass.cleanup(gl);
    }
}

export { create, draw };
