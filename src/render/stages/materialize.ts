// TODO: Compose all input textures into a single texture
import { createParticleBuffer } from "../../gl/buffers";
import { createFrameBuffer, createMultisamplerFrameBuffer } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import type { MultiSampleAntiAlias, Resources, Stage, StageOutput } from "../../types/stage";
import vShaderSource from "../shaders/materialize.vs.glsl?raw";
import fShaderSource from "../shaders/materialize.fs.glsl?raw";
import type { Texture } from "../../types/gl/textures";
import { createRenderBuffer } from "../../gl/renderbuffer";

function loadShaders(gl: WebGL2RenderingContext): ShaderPrograms {
    return {
        materialize: assembleProgram(gl, vShaderSource, fShaderSource, (program) => {
            const positionLocation = gl.getUniformLocation(program, "u_position_texture");
            const colorLocation = gl.getUniformLocation(program, "u_color_texture");
            const propertiesLocation = gl.getUniformLocation(program, "u_properties_texture");
            const screenSizeLocation = gl.getUniformLocation(program, "u_screen_size");
            const particlesTextureSizeLocation = gl.getUniformLocation(program, "u_particles_texture_size");
            const frameLocation = gl.getUniformLocation(program, "u_frame");
            const timeLocation = gl.getUniformLocation(program, "u_time");
            const attributes = {
                index: gl.getAttribLocation(program, "a_index"),
            };
            const uniforms = {
                positionTex: {
                    location: positionLocation,
                    slot: 0,
                },
                colorTex: {
                    location: colorLocation,
                    slot: 1,
                },
                propertiesTex: {
                    location: propertiesLocation,
                    slot: 2,
                },
                screenSize: {
                    location: screenSizeLocation,
                    slot: 3,
                },
                particlesTextureSize: {
                    location: particlesTextureSizeLocation,
                    slot: 4,
                },
                frame: {
                  location: frameLocation,
                  slot: 5,
                },
                time: {
                  location: timeLocation,
                  slot: 6,
                }
            };
            return { program, attributes, uniforms } as ShaderProgram;
        }),
    };
}

function create(gl: WebGL2RenderingContext, input: Stage, width: number, height: number, numParticles: number, msaa?: number): Stage {
    const shaders = loadShaders(gl);
    const output = createOutput(gl, width, height, "materialize_output") as StageOutput;
    const multisampler = msaa ? createMultisampler(gl, width, height, msaa) : undefined;
    
    // Clear the new framebuffer to a known state (0,0,0,0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, output.framebuffer!.framebuffer);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    // Create flipflop age buffer, 1-channel texture
    return {
        name: "materialize",
        resources: {
            buffers: { particles: createParticleBuffer(gl, numParticles) },
            shaders,
            output,
            multisampler
        },
        input,
        targets: output.textures,
        parameters: [],
    };
}

function createTargetTextures(gl: WebGL2RenderingContext, width: number, height: number): Texture[] {
    const mainTexture = createTexture(gl, width, height, "RGBA16F");
    const startTimeTexture = createTexture(gl, width, height, "R32F", "updated_time", true); 
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

function createMultisampler(gl: WebGL2RenderingContext, width: number, height: number, samples: number) {
    const renderbuffer = createRenderBuffer(gl, samples, gl.RGBA16F, width, height);
    const framebuffer = createMultisamplerFrameBuffer(gl, width, height, renderbuffer);
    const multisampler: MultiSampleAntiAlias = {
        samples,
        internalformat: gl.RGBA16F,
        width,
        height,
        renderbuffer,
        framebuffer,
    }
    return multisampler;
}

function draw(gl: WebGL2RenderingContext, stage: Stage, time: number, frame: number, numParticles: number) {
    const { buffers, shaders, output } = stage.resources as Resources & { output: StageOutput };
    const { materialize } = shaders;
    const { particles } = buffers;

    const framebuffer = output.framebuffer!.framebuffer;
    const u = materialize.uniforms;
    const input = stage.input!;

    // --- Common Setup for Both Passes ---
    gl.useProgram(materialize.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, particles);
    gl.viewport(0, 0, stage.targets[0].width, stage.targets[0].height);
    
    // Bind textures and set uniforms once
    gl.uniform1i(u.positionTex.location, u.positionTex.slot);
    gl.uniform1i(u.colorTex.location, u.colorTex.slot);
    gl.uniform1i(u.propertiesTex.location, u.propertiesTex.slot);
    gl.uniform2f(u.screenSize.location, stage.targets[0].width, stage.targets[0].height);
    gl.uniform2i(u.particlesTextureSize.location, input.targets[0].width, input.targets[0].height);
    gl.uniform1i(u.frame.location, frame);
    gl.uniform1f(u.time.location, time);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[0].texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[1].texture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[2].texture);

    gl.enableVertexAttribArray(materialize.attributes.index);
    gl.vertexAttribIPointer(materialize.attributes.index, 1, gl.INT, 0, 0);
    gl.disable(gl.BLEND);
    
    if (stage.resources.multisampler) {
        // MSAA path

        // 0. Clear output FBO
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // 1. Draw timestamps to output FBO
        gl.drawBuffers([gl.NONE, gl.COLOR_ATTACHMENT1]);
        gl.drawArrays(gl.POINTS, 0, numParticles);

        // 2. Draw color to multisample FBO
        gl.bindFramebuffer(gl.FRAMEBUFFER, stage.resources.multisampler.framebuffer.framebuffer);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.NONE]);
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // black background for particles
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, numParticles);

        // 3. Resolve multisample FBO to output FBO's color texture
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, stage.resources.multisampler.framebuffer.framebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
        gl.readBuffer(gl.COLOR_ATTACHMENT0);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.NONE]);
        gl.blitFramebuffer(
            0, 0, stage.targets[0].width, stage.targets[0].height,
            0, 0, stage.targets[0].width, stage.targets[0].height,
            gl.COLOR_BUFFER_BIT,
            gl.NEAREST
        );

    } else {
        // Non-MSAA path
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, numParticles);
    }

    // --- Cleanup ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(null);
}

export { create, draw };
