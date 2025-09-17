import { createQuad } from "../../gl/buffers";
import { createFrameBuffer } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import type { Resources, Stage, StageOutput } from "../../types/stage";
import fShaderSource from "../shaders/combine.fs.glsl?raw";
import vShaderSource from "../shaders/texture_quad.vs.glsl?raw";

function loadShaders(gl: WebGL2RenderingContext): ShaderPrograms {
    return {
        combine: assembleProgram(gl, vShaderSource, fShaderSource, (program) => {
            const attributes = {
                position: gl.getAttribLocation(program, "position"),
            };
            const uniforms = {
                texture1: {
                    location: gl.getUniformLocation(program, "texture_1"),
                    slot: 0,
                },
                texture2: {
                    location: gl.getUniformLocation(program, "texture_2"),
                    slot: 1,
                },
                texture3: {
                    location: gl.getUniformLocation(program, "texture_3"),
                    slot: 2,
                },
                texture4: {
                    location: gl.getUniformLocation(program, "texture_4"),
                    slot: 3,
                },
                numTextures: {
                  location: gl.getUniformLocation(program, "num_textures"),
                  slot: 4
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

function create(gl: WebGL2RenderingContext, input: Stage): Stage {
    const shaders = loadShaders(gl);
    const output = createOutput(gl, input.targets[0].width, input.targets[0].height, "motionblur_output_1");

    return {
        name: "combine",
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

function draw(gl: WebGL2RenderingContext, stage: Stage, inputs: Stage[]) {
    const { buffers, shaders, output } = stage.resources as Resources & { output: StageOutput };
    const { combine } = shaders;
    const { quad } = buffers;
    const u = combine.uniforms;
    const input = stage.input!;
    const framebuffer = output.framebuffer.framebuffer;

    if (inputs.length > 3) {
      throw new Error("Combine supports at most 3 additional stages");
    }
    gl.viewport(0, 0, input.targets[0].width, input.targets[0].height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //gl.enable(gl.BLEND);
    gl.disable(gl.BLEND);
    //gl.blendFunc(gl.ONE, gl.ONE);

    gl.useProgram(combine.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(u.numTextures.location, inputs.length + 1);
    gl.uniform1i(u.texture1.location, u.texture1.slot);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[0].texture);

    if (inputs.length >= 1) {
      gl.activeTexture(gl.TEXTURE1);
      gl.uniform1i(u.texture2.location, u.texture2.slot);
      gl.bindTexture(gl.TEXTURE_2D, inputs[0].targets[0].texture);
    }
    if (inputs.length >= 2) {
      gl.activeTexture(gl.TEXTURE2);
      gl.uniform1i(u.texture3.location, u.texture3.slot);
      gl.bindTexture(gl.TEXTURE_2D, inputs[1].targets[0].texture);
    }
    if (inputs.length >= 3) {
      gl.activeTexture(gl.TEXTURE3);
      gl.uniform1i(u.texture4.location, u.texture4.slot);
      gl.bindTexture(gl.TEXTURE_2D, inputs[2].targets[0].texture);
    }

    gl.enableVertexAttribArray(combine.attributes.position);
    gl.vertexAttribPointer(combine.attributes.position, 2, gl.FLOAT, false, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(null);
}

export { create, draw };
