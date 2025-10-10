import { createQuad } from "../../gl/buffers";
import { createFrameBuffer, getFramebufferAttachment } from "../../gl/framebuffers";
import { assembleProgram } from "../../gl/shaders";
import { createTexture } from "../../gl/textures";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import type { Texture } from "../../types/gl/textures";
import type { Uniform } from "../../types/gl/uniforms";
import type { BufferedStageOutput, Resources, Stage, StageOutput } from "../../types/stage";
import fShaderSource from "../shaders/accumulate.fs.glsl?raw";
import vShaderSource from "../shaders/texture_quad.vs.glsl?raw";

function loadShaders(gl: WebGL2RenderingContext): ShaderPrograms {
    return {
        accumulate: assembleProgram(gl, vShaderSource, fShaderSource, (program) => {
            const previousColorLocation = gl.getUniformLocation(program, "previous_color_tex");
            const previousUpdatedLocation = gl.getUniformLocation(program, "previous_updated_tex");
            const stampColorLocation = gl.getUniformLocation(program, "stamp_color_tex");
            const stampUpdatedLocation = gl.getUniformLocation(program, "stamp_updated_tex");
            const frameLocation = gl.getUniformLocation(program, "u_frame");
            const timeLocation = gl.getUniformLocation(program, "u_time");
            const fadeTimeLocation = gl.getUniformLocation(program, "u_fade_time");
            const attributes = {
                position: gl.getAttribLocation(program, "position"),
            };
          const uniforms = {
            previousColorTexture: {
              location: previousColorLocation,
              slot: 0,
            },
            previousUpdatedTexture: {
              location: previousUpdatedLocation,
              slot: 1,
            },
            stampColorTexture: {
              location: stampColorLocation,
              slot: 2,
            },
            stampUpdatedTexture: {
              location: stampUpdatedLocation,
              slot: 3,
            },
            frame: {
              location: frameLocation,
              slot: 4,
            },
            time: {
              location: timeLocation,
              slot: 5,
            },
            fadeTime: {
              location: fadeTimeLocation,
              slot: 6,
              ui: {
                name: "Fade time",
                min: 0.1,
                max: 10.0,
              },
              value: 2.0,
              type: "float"
            }
          };
            return { program, attributes, uniforms } as ShaderProgram;
        }),
    };
}

function createTargetTextures(gl: WebGL2RenderingContext, width: number, height: number): Texture[] {
    return [
        createTexture(gl, width, height, "RGBA16F"),
        createTexture(gl, width, height, "R32F", "updated_time", true),
    ];
}

function createOutput(gl: WebGL2RenderingContext, width: number, height: number, name: string) {
    const textures = createTargetTextures(gl, width, height);
    const framebuffer = createFrameBuffer(gl, width, height, textures);
    return { name, textures, framebuffer} as StageOutput;
}

function create(gl: WebGL2RenderingContext, input: Stage): Stage {
    const shaders = loadShaders(gl);
    const { width, height } = input.targets[0];

    const output = [
        createOutput(gl, width, height, "accumulate_output_1"), 
        createOutput(gl, width, height, "accumulate_output_2")] as BufferedStageOutput;

    const uniforms = shaders.accumulate!.uniforms;
    const parameters = Object.keys(uniforms)
      .map((k) => (uniforms[k]))
      .filter((u: Uniform) => (!!u.ui));
    parameters.sort((a: Uniform, b: Uniform) => (a.ui!.name.localeCompare(b.ui!.name)));

    return {
        name: "accumulate",
        resources: {
            buffers: { quad: createQuad(gl) },
            shaders,
            output,
        },
        input,
        targets: output[0].textures,
        parameters,
    };
}

function draw(gl: WebGL2RenderingContext, stage: Stage, time: number, frame: number) {
    const { buffers, shaders, output } = stage.resources as Resources & { output: BufferedStageOutput };
    const { accumulate } = shaders;
    const { quad } = buffers;
    const u = accumulate.uniforms;

    const writeIndex = (frame + 1) % 2;
    const readIndex = frame % 2;
    const targets = output[writeIndex].textures;
    const sources = output[readIndex].textures;
    
    const framebufferAttachments = Array.from({ length: targets.length }, (_, i) => getFramebufferAttachment(gl, i));
    const framebuffer = output[writeIndex].framebuffer!.framebuffer;

    const input = stage.input!;
    gl.viewport(0, 0, input.targets[0].width, input.targets[0].height);
    gl.useProgram(accumulate.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.uniform1i(u.previousColorTexture.location, u.previousColorTexture.slot);
    gl.uniform1i(u.previousUpdatedTexture.location, u.previousUpdatedTexture.slot);
    gl.uniform1i(u.stampColorTexture.location, u.stampColorTexture.slot);
    gl.uniform1i(u.stampUpdatedTexture.location, u.stampUpdatedTexture.slot);
    gl.uniform1i(accumulate.uniforms.frame.location, frame);
    gl.uniform1f(accumulate.uniforms.time.location, time);
    gl.uniform1f(u.fadeTime.location, u.fadeTime.value as number);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sources[0].texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, sources[1].texture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[0].texture);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, input.targets[1].texture);
    gl.enableVertexAttribArray(accumulate.attributes.position);
    gl.vertexAttribPointer(accumulate.attributes.position, 2, gl.FLOAT, false, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.drawBuffers(framebufferAttachments);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(null);
    stage.targets = targets;
    stage.resources.currentOutput = output[writeIndex];
}

export { create, draw };
