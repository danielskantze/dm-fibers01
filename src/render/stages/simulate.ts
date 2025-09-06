import { createQuad } from "../../gl/buffers";
import { createFrameBuffer, getFramebufferAttachment } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import type { Texture } from "../../types/gl/textures";
import type { Stage, StageOutput, Resources, BufferedStageOutput } from "../../types/stage";
import fShaderSource from "../shaders/simulate.fs.glsl?raw";
import vShaderSource from "../shaders/texture_quad.vs.glsl?raw";

function loadShaders(gl: WebGL2RenderingContext): ShaderPrograms {
    return {
        simulate: assembleProgram(gl, vShaderSource, fShaderSource, (program) => {
            const positionLocation = gl.getUniformLocation(program, "u_position_texture");
            const colorLocation = gl.getUniformLocation(program, "u_color_texture");
            const propertiesLocation = gl.getUniformLocation(program, "u_properties_texture");

            const timeLocation = gl.getUniformLocation(program, "u_time");
            const particlesTextureSizeLocation = gl.getUniformLocation(program, "u_particles_texture_size");
            const screenSizeLocation = gl.getUniformLocation(program, "u_screen_size");
            const frameLocation = gl.getUniformLocation(program, "u_frame");

            const strokeNoisePLocation = gl.getUniformLocation(program, "u_stroke_noise_p");
            const strokeDriftPLocation = gl.getUniformLocation(program, "u_stroke_drift_p");
            const colorNoisePLocation = gl.getUniformLocation(program, "u_color_noise_p");
            const cosPalette1Location = gl.getUniformLocation(program, "u_cos_palette_1");
            const cosPalette2Location = gl.getUniformLocation(program, "u_cos_palette_2");
            const cosPalette3Location = gl.getUniformLocation(program, "u_cos_palette_3");
            const cosPalette4Location = gl.getUniformLocation(program, "u_cos_palette_4");

            const attributes = {
                position: gl.getAttribLocation(program, "position"),
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
                time: {
                    location: timeLocation,
                    slot: 3,
                },
                particlesTextureSize: {
                    location: particlesTextureSizeLocation,
                    slot: 4,
                },
                screenSize: {
                    location: screenSizeLocation,
                    slot: 5,
                },
                frame: {
                    location: frameLocation,
                    slot: 6,
                },
                strokeNoise: {
                  location: strokeNoisePLocation,
                  slot: 7,
                },
                strokeDrift: {
                  location: strokeDriftPLocation,
                  slot: 8,
                },
                colorNoise: {
                  location: colorNoisePLocation,
                  slot: 9,
                },
                cosPalette1: {
                  location: cosPalette1Location,
                  slot: 10
                },
                cosPalette2: {
                  location: cosPalette2Location,
                  slot: 11
                },
                cosPalette3: {
                  location: cosPalette3Location,
                  slot: 12
                },
                cosPalette4: {
                  location: cosPalette4Location,
                  slot: 13
                }
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

function createTargetTextures(gl: WebGL2RenderingContext, width: number, height: number): Texture[] {
    const geometryTexture = createTexture(gl, width, height, "RGBA32F", "geometry", true);
    const colorTexture = createTexture(gl, width, height, "RGBA32F", "color", true);
    const propertiesTexture = createTexture(gl, width, height, "RGBA32F", "properties", true);
    const targetTextures = [
        geometryTexture,
        colorTexture,
        propertiesTexture,
    ];
    return targetTextures;
}

function createOutput(gl: WebGL2RenderingContext, width: number, height: number, name: string) {
    const textures = createTargetTextures(gl, width, height);
    const framebuffer = createFrameBuffer(gl, width, height, textures);
    return { name, textures, framebuffer } as StageOutput;
}

function getTextureSize(numParticles: number) {
    const width = Math.ceil(Math.sqrt(numParticles));
    return { width, height: width };
}

function create(gl: WebGL2RenderingContext, numParticles: number): Stage {
    const shaders = loadShaders(gl);
    const { width, height } = getTextureSize(numParticles);
    const output = [
        createOutput(gl, width, height, "simulate_output_1"), 
        createOutput(gl, width, height, "simulate_output_2")] as BufferedStageOutput;
    return {
        name: "simulate",
        resources: {
            buffers: { quad: createQuad(gl) },
            shaders,
            output,
        },
        input: null,
        targets: output[0].textures,
    };
}

// TODO: Clean up textures and framebuffers when resizing

function resize(gl: WebGL2RenderingContext, numParticles: number, stage: Stage) {
    const { width, height } = getTextureSize(numParticles);
    const output = [
        createOutput(gl, width, height, "simulate_output_1"), 
        createOutput(gl, width, height, "simulate_output_2")] as BufferedStageOutput;

    stage.resources.output = output;
}

function draw(gl: WebGL2RenderingContext, stage: Stage, time: number, frame: number) {
    const { buffers, shaders, output } = stage.resources as Resources & { output: BufferedStageOutput };
    const { simulate } = shaders;
    const { quad } = buffers;
    const writeIndex = (frame + 1) % 2;
    const readIndex = frame % 2;
    const targets = output[writeIndex].textures;
    const sources = output[readIndex].textures;
    const framebufferAttachments = Array.from({ length: targets.length }, (_, i) => getFramebufferAttachment(gl, i));
    const framebuffer = output[writeIndex].framebuffer!.framebuffer;
    const u = simulate.uniforms;

    gl.viewport(0, 0, targets[0].width, targets[0].height); // all targets have the same size
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.disable(gl.BLEND);
    
    gl.useProgram(simulate.program);
    gl.uniform1f(u.time.location, time);
    gl.uniform2i(u.particlesTextureSize.location, sources[0].width, sources[0].height);
    gl.uniform2f(u.screenSize.location, gl.canvas.width, gl.canvas.height);
    gl.uniform1i(u.frame.location, frame);
    gl.uniform1i(u.positionTex.location, u.positionTex.slot);
    gl.uniform1i(u.colorTex.location, u.colorTex.slot);
    gl.uniform1i(u.propertiesTex.location, u.propertiesTex.slot);

    gl.uniform4f(u.strokeNoise.location, 0.5, 0.1, 1.55, 0.33);
    gl.uniform4f(u.strokeDrift.location, 0.03, 0.01, 0.1, 0.1);
    gl.uniform4f(u.colorNoise.location, 0.1, 0.1, 0.001, 0.05);

    gl.uniform3fv(u.cosPalette1.location, [0.5, 0.1, 0.3]);
    gl.uniform3fv(u.cosPalette2.location, [0.5, 0.5, 0.5]);
    gl.uniform3fv(u.cosPalette3.location, [1.0, 1.0, 1.0]);
    gl.uniform3fv(u.cosPalette4.location, [0.0, 0.9, 0.9]);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sources[0].texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, sources[1].texture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, sources[2].texture);

    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(simulate.attributes.position);
    gl.vertexAttribPointer(simulate.attributes.position, 2, gl.FLOAT, false, 0, 0);
    gl.drawBuffers(framebufferAttachments);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(null);

    stage.targets = output[writeIndex].textures;
}

export { create, draw, resize };
