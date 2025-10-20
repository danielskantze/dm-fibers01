// TODO: Compose all input textures into a single texture
import { createParticleBuffer } from "../../gl/buffers";
import { createFrameBuffer } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import type { Texture } from "../../types/gl/textures";
import type { TextureUniform } from "../../types/gl/uniforms";
import type { Resources, Stage, StageOutput } from "../../types/stage";
import fShaderSource from "../shaders/materialize.fs.glsl?raw";
import vShaderSource from "../shaders/materialize.vs.glsl?raw";

function loadShaders(gl: WebGL2RenderingContext): ShaderPrograms {
    return {
        shader: assembleProgram(gl, vShaderSource, fShaderSource, (program) => {
            const positionLocation = gl.getUniformLocation(program, "u_position_texture");
            const colorLocation = gl.getUniformLocation(program, "u_color_texture");
            const propertiesLocation = gl.getUniformLocation(program, "u_properties_texture");
            const screenSizeLocation = gl.getUniformLocation(program, "u_screen_size");
            const particlesTextureSizeLocation = gl.getUniformLocation(program, "u_particles_texture_size");
            const frameLocation = gl.getUniformLocation(program, "u_frame");
            const attributes = {
                index: gl.getAttribLocation(program, "a_index"),
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
                screenSize: {
                    location: screenSizeLocation,
                },
                particlesTextureSize: {
                    location: particlesTextureSizeLocation,
                },
                frame: {
                  location: frameLocation,
                },
            };
            return { program, attributes, uniforms } as ShaderProgram;
        }),
    };
}

function reset(gl: WebGL2RenderingContext, stage: Stage) {
  const { output } = stage.resources as Resources & { output: StageOutput };
  const { framebuffer } = output.framebuffer!;
  const clearFloat = new Float32Array([0.0, 0.0, 0.0, 0.0]);
  const clearInt = new Int32Array([0, 0, 0, 0]);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.clearBufferfv(gl.COLOR, 0, clearFloat);
  gl.clearBufferiv(gl.COLOR, 1, clearInt);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function create(gl: WebGL2RenderingContext, input: Stage, width: number, height: number, numParticles: number): Stage {
    const shaders = loadShaders(gl);
    const output = createOutput(gl, width, height, "materialize_output") as StageOutput;
    
    // Clear the new framebuffer to a known state (0,0,0,0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, output.framebuffer!.framebuffer);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.clearBufferfv(gl.COLOR, 0, [0.0, 0.0, 0.0, 0.0]);
    gl.clearBufferiv(gl.COLOR, 1, [0, 0, 0, 0]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    // Create flipflop age buffer, 1-channel texture
    return {
        name: "materialize",
        resources: {
            buffers: { particles: createParticleBuffer(gl, numParticles) },
            shaders,
            output,
        },
        input,
        targets: output.textures,
        parameters: {},
    };
}

function createTargetTextures(gl: WebGL2RenderingContext, width: number, height: number): Texture[] {
    const mainTexture = createTexture(gl, width, height, "RGBA16F");
    const startTimeTexture = createTexture(gl, width, height, "R32I", "updated_frame", true); 
    const targetTextures = [
        mainTexture,
        startTimeTexture,
    ];
    return targetTextures;
}

function createOutput(gl: WebGL2RenderingContext, width: number, height: number, name: string) {
    const textures = createTargetTextures(gl, width, height);
    const framebuffer = createFrameBuffer(gl, width, height, textures);
    return { name, textures, framebuffer} as StageOutput;
}

function draw(gl: WebGL2RenderingContext, stage: Stage, frame: number, numParticles: number) {
    const { buffers, shaders, output } = stage.resources as Resources & { output: StageOutput };
    const { shader } = shaders;
    const { particles } = buffers;

    const framebuffer = output.framebuffer!.framebuffer;
    const u = shader.uniforms;
    const input = stage.input!;

    // --- Common Setup for Both Passes ---
    gl.useProgram(shader.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, particles);
    gl.viewport(0, 0, stage.targets[0].width, stage.targets[0].height);
    
    // Bind textures and set uniforms once
    gl.uniform1i(u.positionTex.location, (u.positionTex as TextureUniform).slot);
    gl.uniform1i(u.colorTex.location, (u.colorTex as TextureUniform).slot);
    gl.uniform1i(u.propertiesTex.location, (u.propertiesTex as TextureUniform).slot);
    gl.uniform2f(u.screenSize.location, stage.targets[0].width, stage.targets[0].height);
    gl.uniform2i(u.particlesTextureSize.location, input.targets[0].width, input.targets[0].height);
    gl.uniform1i(u.frame.location, frame);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[0].texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[1].texture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[2].texture);

    gl.enableVertexAttribArray(shader.attributes.index);
    gl.vertexAttribIPointer(shader.attributes.index, 1, gl.INT, 0, 0);
    gl.disable(gl.BLEND);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.clearBufferfv(gl.COLOR, 0, [0.0, 0.0, 0.0, 1.0]);
    gl.clearBufferiv(gl.COLOR, 1, [0, 0, 0, 0]);
    gl.drawArrays(gl.POINTS, 0, numParticles);

    // --- Cleanup ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(null);
}

export { create, draw, reset };
