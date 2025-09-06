// import * as stage_test from "./render/stages/test";
import * as stage_display from "./render/stages/display";
import * as stage_post from "./render/stages/post";
import * as stage_simulate from "./render/stages/simulate";
import * as stage_accumulate from "./render/stages/accumulate";
import { WebGLTextureError } from "./types/error";

function configureCanvas(canvas: HTMLCanvasElement) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = window.devicePixelRatio;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}

function main(canvas: HTMLCanvasElement) {
  configureCanvas(canvas);
  const startTime = performance.now();
  const numParticles = 50000;
  const gl = canvas.getContext("webgl2")!
  const ext = gl.getExtension("EXT_color_buffer_float");
  if (!ext) {
    throw new WebGLTextureError("This browser does not support rendering to float textures");
  }  
  const simulateStage = stage_simulate.create(gl, numParticles);
  //const testStage = stage_test.create(gl, canvas.width, canvas.height);
  const accumulateStage = stage_accumulate.create(gl, simulateStage, canvas.width, canvas.height, numParticles);
  const postStage = stage_post.create(gl, accumulateStage);
  const displayStage = stage_display.create(gl, postStage);
  
  let frame = 0;

  function draw() {
    const time = (performance.now() - startTime) / 1000;
    for (let i = 0; i < 2; i++) {
      stage_simulate.draw(gl, simulateStage, time, frame);
      // stage_test.draw(gl, testStage);
      stage_accumulate.draw(gl, accumulateStage, numParticles);
      stage_post.draw(gl, postStage);
      stage_display.draw(gl, displayStage);
      frame++;
    }
    requestAnimationFrame(() => { 
      draw();
    });
  }

  function resize() {
    configureCanvas(canvas);
    stage_accumulate.resize(gl, canvas.width, canvas.height, accumulateStage);
    stage_post.resize(gl, postStage);
  }

  window.addEventListener("resize", resize);

  draw();
}

export default main;

// TODO:
// - Add UI for tweaking
//     * Clear button
//     * Seed
//     * Num particles
//     * Control palette (initally cosine palette params, later types)
//     * Strokes: Scale & drift
//     * Coloring: Scale & drift

// Implementation steps:
// 1. Implement uniforms for all props and set from typescript code
// 2. Implement simple ui (test realtime changes)
// 3. Implement fancy ui
