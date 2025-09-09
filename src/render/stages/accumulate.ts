// TODO: Compose all input textures into a single texture
import { createParticleBuffer } from "../../gl/buffers";
import { createFrameBuffer } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import type { Resources, Stage, StageOutput } from "../../types/stage";
import vShaderSource from "../shaders/accumulate.vs.glsl?raw";
import fShaderSource from "../shaders/accumulate.fs.glsl?raw";

function loadShaders(gl: WebGL2RenderingContext): ShaderPrograms {
    return {
        accumulate: assembleProgram(gl, vShaderSource, fShaderSource, (program) => {
            const positionLocation = gl.getUniformLocation(program, "u_position_texture");
            const colorLocation = gl.getUniformLocation(program, "u_color_texture");
            const propertiesLocation = gl.getUniformLocation(program, "u_properties_texture");
            const screenSizeLocation = gl.getUniformLocation(program, "u_screen_size");
            const particlesTextureSizeLocation = gl.getUniformLocation(program, "u_particles_texture_size");
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
            };
            return { program, attributes, uniforms } as ShaderProgram;
        }),
    };
}

function create(gl: WebGL2RenderingContext, input: Stage, width: number, height: number, numParticles: number): Stage {
    const shaders = loadShaders(gl);
    const targetTexture = createTexture(gl, width, height, "RGBA");
    const framebuffer = createFrameBuffer(gl, width, height, [targetTexture]);

    return {
        name: "accumulate",
        resources: {
            buffers: { particles: createParticleBuffer(gl, numParticles) },
            shaders,
            output: {
                name: "accumulate_output",
                textures: [targetTexture],
                framebuffer,
            } as StageOutput,
        },
        input,
        targets: [targetTexture],
        parameters: [],
    };
}

function resize(gl: WebGL2RenderingContext, width: number, height: number, stage: Stage) {
    const targetTexture = createTexture(gl, width, height, "RGBA");
    const framebuffer = createFrameBuffer(gl, width, height, [targetTexture]);
    const output = stage.resources.output as StageOutput;
    output.framebuffer = framebuffer;
    stage.targets[0] = targetTexture;
}

function draw(gl: WebGL2RenderingContext, stage: Stage, numParticles: number) {
    const { buffers, shaders, output } = stage.resources as Resources & { output: StageOutput };
    const { accumulate } = shaders;
    const { particles } = buffers;
    const u = accumulate.uniforms;
    const input = stage.input!;
    gl.viewport(0, 0, stage.targets[0].width, stage.targets[0].height);

    gl.bindFramebuffer(gl.FRAMEBUFFER, output.framebuffer!.framebuffer);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(accumulate.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, particles);

    gl.uniform1i(u.positionTex.location, u.positionTex.slot);
    gl.uniform1i(u.colorTex.location, u.colorTex.slot);
    gl.uniform1i(u.propertiesTex.location, u.propertiesTex.slot);
    gl.uniform2f(u.screenSize.location, stage.targets[0].width, stage.targets[0].height);
    gl.uniform2i(u.particlesTextureSize.location, input.targets[0].width, input.targets[0].height);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[0].texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[1].texture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[2].texture);

    gl.enableVertexAttribArray(accumulate.attributes.index);
    gl.vertexAttribIPointer(accumulate.attributes.index, 1, gl.INT, 0, 0);
    gl.drawArrays(gl.POINTS, 0, numParticles);
    
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(null);
}

export { create, draw, resize };
