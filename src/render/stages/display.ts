import { createQuad } from "../../gl/buffers";
import { assembleProgram } from "../../gl/shaders";
import type { ShaderProgram, ShaderPrograms } from "../../types/gl/shaders";
import type { Stage } from "../../types/stage";
import fShaderSource from "../shaders/texture.fs.glsl?raw";
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

    return {
        name: "display",
        resources: {
            buffers: { quad: createQuad(gl) },
            shaders,
        },
        input,
        targets: [],
        parameters: [],
    };
}

function draw(gl: WebGL2RenderingContext, stage: Stage, width: number, height: number) {
    const { buffers, shaders } = stage.resources;
    const { display } = shaders;
    const { quad } = buffers;
    const { tex } = display.uniforms;
    const input = stage.input!;
    gl.viewport(0, 0, width, height);
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
    gl.useProgram(null);
}

export { create, draw };
