import { createQuad } from "../../gl/buffers";
import { createFrameBuffer } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import type { TextureUniform } from "../../types/gl/uniforms";
import type { Resources, Stage, StageOutput } from "../../types/stage";
import fShaderSource from "../shaders/combine.fs.glsl?raw";
import vShaderSource from "../shaders/texture_quad.vs.glsl?raw";

function loadShaders(gl: WebGL2RenderingContext): ShaderPrograms {
    return {
        shader: assembleProgram(gl, vShaderSource, fShaderSource, (program) => {
            const attributes = {
                position: gl.getAttribLocation(program, "position"),
            };
            const uniforms = {
                texture1: {
                  type: "tex2d",
                  location: gl.getUniformLocation(program, "texture_1"),
                  slot: 0,
                } as TextureUniform,
                texture2: {
                  type: "tex2d",
                  location: gl.getUniformLocation(program, "texture_2"),
                  slot: 1,
                } as TextureUniform,
                intensity1: {
                    location: gl.getUniformLocation(program, "intensity1"),
                },
                intensity2: {
                    location: gl.getUniformLocation(program, "intensity2"),
                }
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

function reset(gl: WebGL2RenderingContext, stage: Stage) {
  const { output } = stage.resources as Resources & { output: StageOutput };
  const { framebuffer } = output.framebuffer!;
  const clearFloat = new Float32Array([0.0, 0.0, 0.0, 1.0]);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.clearBufferfv(gl.COLOR, 0, clearFloat);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function create(gl: WebGL2RenderingContext, input: Stage): Stage {
    const shaders = loadShaders(gl);
    const output = createOutput(gl, input.targets[0].width, input.targets[0].height, "combine_output");

    return {
        name: "combine",
        resources: {
            buffers: { quad: createQuad(gl) },
            shaders,
            output
        },
        input,
        targets: output.textures,
        parameters: {},
    };
}

function draw(gl: WebGL2RenderingContext, stage: Stage, stage2: Stage, intensity1: number, intensity2: number) {
    const { buffers, shaders, output } = stage.resources as Resources & { output: StageOutput };
    const { shader } = shaders;
    const { quad } = buffers;
    const u = shader.uniforms;
    const stage1Input = stage.input!;
    const framebuffer = output.framebuffer.framebuffer;

    gl.viewport(0, 0, stage1Input.targets[0].width, stage1Input.targets[0].height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.BLEND);

    gl.useProgram(shader.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.uniform1f(u.intensity1.location, intensity1);
    gl.uniform1f(u.intensity2.location, intensity2);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(u.texture1.location, (u.texture1 as TextureUniform).slot);
    gl.bindTexture(gl.TEXTURE_2D, stage1Input.targets[0].texture);

    gl.activeTexture(gl.TEXTURE1);
    gl.uniform1i(u.texture2.location, (u.texture2 as TextureUniform).slot);
    gl.bindTexture(gl.TEXTURE_2D, stage2.targets[0].texture);

    gl.enableVertexAttribArray(shader.attributes.position);
    gl.vertexAttribPointer(shader.attributes.position, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(null);
}

export { create, draw, reset };
