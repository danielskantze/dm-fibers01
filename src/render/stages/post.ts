import { createQuad } from "../../gl/buffers";
import { createFrameBuffer } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import type { Resources, Stage, StageOutput } from "../../types/stage";
import fShaderSource from "../shaders/post.fs.glsl?raw";
import vShaderSource from "../shaders/texture_quad.vs.glsl?raw";

function loadShaders(gl: WebGL2RenderingContext): ShaderPrograms {
    return {
        display: assembleProgram(gl, vShaderSource, fShaderSource, (program) => {
            const location = gl.getUniformLocation(program, "tex");
            const attributes = {
                position: gl.getAttribLocation(program, "position"),
            };
            const uniforms = {
                tex: {
                    location,
                    slot: 0,
                },
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
        name: "post_output",
        textures: [targetTexture],
        framebuffer,
    } as StageOutput;

    return {
        name: "post",
        resources: {
            buffers: { quad: createQuad(gl) },
            shaders,
            output,
        },
        input,
        targets: [targetTexture],
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

function draw(gl: WebGL2RenderingContext, stage: Stage) {
    const { buffers, shaders, output } = stage.resources as Resources & { output: StageOutput };
    const { display } = shaders;
    const { quad } = buffers;
    const { tex } = display.uniforms;
    const input = stage.input!;
    gl.viewport(0, 0, input.targets[0].width, input.targets[0].height);
    gl.useProgram(display.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(tex.location, tex.slot);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[0].texture);
    gl.enableVertexAttribArray(display.attributes.position);
    gl.vertexAttribPointer(display.attributes.position, 2, gl.FLOAT, false, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, output.framebuffer!.framebuffer);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(null);
}

export { create, draw, resize };
