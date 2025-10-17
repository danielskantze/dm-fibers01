import { createQuad } from "../../gl/buffers";
import { createFrameBuffer } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import type { Resources, Stage, StageOutput } from "../../types/stage";
import fShaderSource from "../shaders/luma.fs.glsl?raw";
import vShaderSource from "../shaders/texture_quad.vs.glsl?raw";

function loadShaders(gl: WebGL2RenderingContext): ShaderPrograms {
    return {
        shader: assembleProgram(gl, vShaderSource, fShaderSource, (program) => {
            const location = gl.getUniformLocation(program, "tex");
            const attributes = {
                position: gl.getAttribLocation(program, "position"),
            };
            const uniforms = {
                tex: {
                    location,
                    slot: 0,
                },
                threshold: {
                    location: gl.getUniformLocation(program, "u_threshold"),
                    slot: 1,
                },
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

function create(gl: WebGL2RenderingContext, input: Stage): Stage {
    const shaders = loadShaders(gl);

    const output = createOutput(gl, input.targets[0].width, input.targets[0].height, "luma_output");

    return {
        name: "luma",
        resources: {
            buffers: { quad: createQuad(gl) },
            shaders,
            output,
            currentOutput: output,
        },
        input,
        targets: [output.textures[0]],
        parameters: {},
    };
}

function draw(gl: WebGL2RenderingContext, stage: Stage, threshold: number) {
    const { buffers, shaders, output } = stage.resources as Resources & { output: StageOutput };
    const { shader } = shaders;
    const { quad } = buffers;
    const u = shader.uniforms;
    const input = stage.input!;
    const framebuffer = output.framebuffer.framebuffer;
    gl.viewport(0, 0, input.targets[0].width, input.targets[0].height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.useProgram(shader.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(u.tex.location, u.tex.slot);
    gl.uniform1f(u.threshold.location, threshold);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[0].texture);
    gl.enableVertexAttribArray(shader.attributes.position);
    gl.vertexAttribPointer(shader.attributes.position, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(null);
}

export { create, draw };
