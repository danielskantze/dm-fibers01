import { createQuad } from "../../gl/buffers";
import { createFrameBuffer } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import type { Stage, StageOutput } from "../../types/stage";
import fShaderSource from "../shaders/display.fs.glsl?raw";
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

function createOutput(gl: WebGL2RenderingContext, width: number, height: number, name: string) {
    const textures = [createTexture(gl, width, height, "RGBA")];
    const framebuffer = createFrameBuffer(gl, width, height, textures);
    return { name, textures, framebuffer} as StageOutput;
}

function create(gl: WebGL2RenderingContext, input: Stage): Stage {
    const shaders = loadShaders(gl);
    const output = createOutput(gl, input.targets[0].width, input.targets[0].height, "screenshot");

    return {
        name: "display",
        resources: {
            buffers: { quad: createQuad(gl) },
            shaders,
            output
        },
        input,
        targets: output.textures,
        parameters: [],
    };
}

function draw(gl: WebGL2RenderingContext, stage: Stage) {
    const { buffers, shaders } = stage.resources;
    const { display } = shaders;
    const { quad } = buffers;
    const { tex } = display.uniforms;
    const { framebuffer } = (stage.resources.output as StageOutput).framebuffer;
    const input = stage.input!;
    const { width, height } = input.targets[0];
    gl.viewport(0, 0, width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //gl.enable(gl.BLEND);
    gl.disable(gl.BLEND);
    //gl.blendFunc(gl.ONE, gl.ONE);

    gl.useProgram(display.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(tex.location, tex.slot);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[0].texture);
    gl.enableVertexAttribArray(display.attributes.position);
    gl.vertexAttribPointer(display.attributes.position, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(null);
}

export { create, draw };
