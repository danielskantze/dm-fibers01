import { createQuad } from "../../gl/buffers";
import { createFrameBuffer } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import type { Resources, Stage, StageOutput } from "../../types/stage";
import fShaderSource from "../shaders/accumulate.fs.glsl?raw";
import vShaderSource from "../shaders/texture_quad.vs.glsl?raw";

function loadShaders(gl: WebGL2RenderingContext): ShaderPrograms {
    return {
        display: assembleProgram(gl, vShaderSource, fShaderSource, (program) => {
            const location = gl.getUniformLocation(program, "tex");
            const updatedLocation = gl.getUniformLocation(program, "updated_tex");
            const frameLocation = gl.getUniformLocation(program, "u_frame");
            const timeLocation = gl.getUniformLocation(program, "u_time");
            const attributes = {
                position: gl.getAttribLocation(program, "position"),
            };
            const uniforms = {
                tex: {
                    location,
                    slot: 0,
                },
                updatedTex: {
                  location: updatedLocation,
                  slot: 1
                },
                frame: {
                  location: frameLocation,
                  slot: 2,
                },
                time: {
                  location: timeLocation,
                  slot: 3,
                }
            };
            return { program, attributes, uniforms } as ShaderProgram;
        }),
    };
}

function create(gl: WebGL2RenderingContext, input: Stage): Stage {
    const shaders = loadShaders(gl);
    const { width, height } = input.targets[0];
    const targetTexture = createTexture(gl, width, height, "RGBA");
    const framebuffer = createFrameBuffer(gl, width, height, [targetTexture]);
    const output = {
        name: "accumulate_output",
        textures: [targetTexture],
        framebuffer,
    } as StageOutput;

    return {
        name: "accumulate",
        resources: {
            buffers: { quad: createQuad(gl) },
            shaders,
            output,
        },
        input,
        targets: [targetTexture],
        parameters: [],
    };
}

function resize(gl: WebGL2RenderingContext, stage: Stage) {
    const input = stage.input!;
    const { width, height } = input.targets[0];
    const targetTexture = createTexture(gl, width, height, "RGBA");
    const framebuffer = createFrameBuffer(gl, width, height, [targetTexture]);
    const output = stage.resources.output as StageOutput;
    output.framebuffer = framebuffer;
    stage.targets[0] = targetTexture;
}

function draw(gl: WebGL2RenderingContext, stage: Stage, time: number, frame: number) {
    const { buffers, shaders, output } = stage.resources as Resources & { output: StageOutput };
    const { display } = shaders;
    const { quad } = buffers;
    const { tex, updatedTex } = display.uniforms;
    const input = stage.input!;
    gl.viewport(0, 0, input.targets[0].width, input.targets[0].height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(display.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(tex.location, tex.slot);
    gl.uniform1i(updatedTex.location, updatedTex.slot);
    gl.uniform1i(display.uniforms.frame.location, frame);
    gl.uniform1f(display.uniforms.time.location, time);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[0].texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[1].texture);
    gl.enableVertexAttribArray(display.attributes.position);
    gl.vertexAttribPointer(display.attributes.position, 2, gl.FLOAT, false, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, output.framebuffer!.framebuffer);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(null);
}

export { create, draw, resize };
