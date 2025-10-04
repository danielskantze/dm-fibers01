import { createQuad } from "../../gl/buffers";
import { assembleProgram } from "../../gl/shaders";
import * as mat4 from "../../math/mat4";
import type { Matrix4x4 } from "../../math/types";
import type { Uniform } from "../../types/gl/uniforms";
import vShaderSource from "./shaders/quad.vs.glsl?raw";
import fShaderSource from "./shaders/vec3-gimbal.fs.glsl?raw";

function initGl(gl: WebGL2RenderingContext) {
  return assembleProgram(gl, vShaderSource, fShaderSource, (program) => {
    const attributes = {
      position: gl.getAttribLocation(program, "position"),
    };
    const uniforms = {
      u_object_mat: {
        location: gl.getUniformLocation(program, "u_object_mat"),
        slot: 0,
      } as Uniform,
      u_object_mat_i: {
        location: gl.getUniformLocation(program, "u_object_mat_i"),
        slot: 1,
      } as Uniform,
      u_magnitude: {
        location: gl.getUniformLocation(program, "u_magnitude"),
        slot: 2,
      } as Uniform,
      u_time: {
        location: gl.getUniformLocation(program, "u_time"),
        slot: 3
      } as Uniform
    };
    return { program, attributes, uniforms };
  });
}

function createVec3GimbalView(width: number, height: number) {
  const canvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const gl = canvas.getContext("webgl2")!;
  const quad = createQuad(gl);
  const { program, attributes, uniforms } = initGl(gl);
  let angle = 0.0;
  const startTime = Date.now();
  let objectMatrix = mat4.identity();
  let objectMatrixI = mat4.identity();
  let magnitude = 1.0;

  function draw() {
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.uniformMatrix4fv(uniforms.u_object_mat.location, false, objectMatrix);
    gl.uniformMatrix4fv(uniforms.u_object_mat_i.location, false, objectMatrixI);
    gl.uniform1f(uniforms.u_time.location, (Date.now() - startTime) / 1000.0);
    gl.uniform1f(uniforms.u_magnitude.location, magnitude);
    gl.enableVertexAttribArray(attributes.position);
    gl.vertexAttribPointer(attributes.position, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.useProgram(null);
  }
  function scheduleDraw() {
    requestAnimationFrame(() => {
      draw();
    });
  }

  scheduleDraw();

  return {
    canvas,
    update: (rotM: Matrix4x4, iRotM: Matrix4x4, length: number) => {
      angle += 0.01;
      objectMatrix = rotM;
      objectMatrixI = iRotM;
      magnitude = length;
      scheduleDraw();
    }
  }
}

export { createVec3GimbalView };
