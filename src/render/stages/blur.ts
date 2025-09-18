import { createQuad } from "../../gl/buffers";
import { createFrameBuffer } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import type { Resources, Stage, StageOutput } from "../../types/stage";
import fShaderSource from "../shaders/blur.fs.glsl?raw";
import vShaderSource from "../shaders/texture_quad.vs.glsl?raw";

function loadShaders(gl: WebGL2RenderingContext): ShaderPrograms {
    return {
        blur: assembleProgram(gl, vShaderSource, fShaderSource, (program) => {
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
    };
}

function createOutput(gl: WebGL2RenderingContext, width: number, height: number, name: string) {
    const textures = [createTexture(gl, width, height, "RGBA")];
    const framebuffer = createFrameBuffer(gl, width, height, textures);
    return { name, textures, framebuffer} as StageOutput;
}

function resize(gl: WebGL2RenderingContext, stage: Stage) {
    const input = stage.input!;
    const { width, height } = input.targets[0];
    const output = createOutput(gl, width, height, "motionblur_output");
    stage.resources.output = output;
}

function create(gl: WebGL2RenderingContext, input: Stage): Stage {
    const shaders = loadShaders(gl);
    const { width, height } = input.targets[0];

    const output = createOutput(gl, width, height, "motionblur_output_1");

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

function draw(gl: WebGL2RenderingContext, stage: Stage, time: number, frame: number, direction: [number, number]) {
    const { buffers, shaders, output } = stage.resources as Resources & { output: StageOutput };
    const { blur } = shaders;
    const { quad } = buffers;
    const u = blur.uniforms;
    const { textures } = output;
    const input = stage.input!;

    const framebuffer = output.framebuffer!.framebuffer;

    gl.viewport(0, 0, textures[0].width, textures[0].height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.disable(gl.BLEND);
    gl.useProgram(blur.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(u.texture.location, u.texture.slot);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[0].texture);
    gl.uniform2fv(u.textureSize.location, [textures[0].width, textures[0].height]);
    gl.uniform2fv(u.direction.location, direction);
    gl.enableVertexAttribArray(blur.attributes.position);
    gl.vertexAttribPointer(blur.attributes.position, 2, gl.FLOAT, false, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(null);
}

export { create, draw };
