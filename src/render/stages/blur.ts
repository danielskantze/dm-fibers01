import { createQuad } from "../../gl/buffers";
import { createFrameBuffer } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import type { BufferedStageOutput, Resources, Stage, StageOutput } from "../../types/stage";
import fShaderSource from "../shaders/blur.fs.glsl?raw";
import vShaderSource from "../shaders/texture_quad.vs.glsl?raw";

function loadShaders(gl: WebGL2RenderingContext): ShaderPrograms {
    return {
        display: assembleProgram(gl, vShaderSource, fShaderSource, (program) => {
            const location = gl.getUniformLocation(program, "tex");
            const previousLocation = gl.getUniformLocation(program, "previous_tex");
            const textureSizeLocation = gl.getUniformLocation(program, "texture_size");
            const attributes = {
                position: gl.getAttribLocation(program, "position"),
            };
            const uniforms = {
                texture: {
                  location,
                  slot: 0,
                },
                previousTexture: {
                  location: previousLocation,
                  slot: 1,
                },
                textureSize: {
                  location: textureSizeLocation,
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
    const output = [
        createOutput(gl, width, height, "motionblur_output_1"), 
        createOutput(gl, width, height, "motionblur_output_2")] as BufferedStageOutput;
    stage.resources.output = output;
}

function create(gl: WebGL2RenderingContext, input: Stage): Stage {
    const shaders = loadShaders(gl);
    const { width, height } = input.targets[0];

    const output = [
        createOutput(gl, width, height, "motionblur_output_1"), 
        createOutput(gl, width, height, "motionblur_output_2")] as BufferedStageOutput;

    return {
        name: "display",
        resources: {
            buffers: { quad: createQuad(gl) },
            shaders,
            output
        },
        input,
        targets: output[0].textures,
        parameters: [],
    };
}

function draw(gl: WebGL2RenderingContext, stage: Stage, time: number, frame: number) {
    const { buffers, shaders, output } = stage.resources as Resources & { output: BufferedStageOutput };
    const { display } = shaders;
    const { quad } = buffers;
    const { texture, previousTexture, textureSize } = display.uniforms;
    const input = stage.input!;

    const writeIndex = (frame + 1) % 2;
    const readIndex = frame % 2;
    const targets = output[writeIndex].textures;
    const sources = output[readIndex].textures;

    const framebuffer = output[writeIndex].framebuffer!.framebuffer;

    gl.viewport(0, 0, targets[0].width, targets[0].height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //gl.enable(gl.BLEND);
    gl.disable(gl.BLEND);
    //gl.blendFunc(gl.ONE, gl.ONE);

    gl.useProgram(display.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(texture.location, texture.slot);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[0].texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.uniform1i(previousTexture.location, previousTexture.slot);
    gl.bindTexture(gl.TEXTURE_2D, sources[0].texture);
    gl.uniform2fv(textureSize.location, [targets[0].width, targets[0].height]);
    gl.enableVertexAttribArray(display.attributes.position);
    gl.vertexAttribPointer(display.attributes.position, 2, gl.FLOAT, false, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(null);

    stage.targets = targets;
}

export { create, draw, resize };
