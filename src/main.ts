// import * as stage_test from "./render/stages/test";
import * as stage_display from "./render/stages/display";
import * as stage_post from "./render/stages/post";
import * as stage_simulate from "./render/stages/simulate";
import * as stage_accumulate from "./render/stages/accumulate";
import { WebGLTextureError } from "./types/error";
import { UniformComponents, type UniformType, type UniformUI } from "./types/gl/uniforms";
import ControlFactory, { type ControlFactoryUniform } from "./ui/controls";

function configureCanvas(canvas: HTMLCanvasElement) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = window.devicePixelRatio;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}

function createUniformControls(factory: ControlFactory, uniforms: ControlFactoryUniform[]) {
  for (const u of uniforms) {
    const { ui } = u;
    if (ui) {
      const {name, min, max, step} = u.ui!;
      const numComponents = UniformComponents[u.type!]!;
      if (numComponents > 1) {
        const values = u.value as number[];
        factory.createVector(name, values, (i, v) => { values[i] = v; }, min, max, step);
      } else {
        const value = u.value as number;
        factory.createScalar(name, value, (v) => { u.value = v; }, min, max, step);
      }
    }
  }
}

function textureSizeFromNumParticles(numParticles: number, maxNumParticles: number): [number, number] {
  let pts = numParticles;
  if (pts > maxNumParticles) {
    pts = maxNumParticles;
  }
  const w = Math.floor(Math.sqrt(pts));
  return [w, w];
}

function createUi(
  controlFactory: ControlFactory, 
  parameters: ControlFactoryUniform[],
  resetFn: () => void,
  pauseFn: () => void,
) {
  createUniformControls(controlFactory, parameters);
  controlFactory.createButton("Clear", () => {
    resetFn();
  });
  controlFactory.createButton("Pause", pauseFn);
}

function createUIParameter(type: UniformType, value: number | number[], ui: UniformUI): ControlFactoryUniform {
  return { type, value, ui };
}

function logDebug(text: string, force: boolean = false) {
  const debug = document.getElementById("debug")!;
  if (!force) {
    debug.innerHTML += text + "<br>";
  } else {
    debug.innerHTML = text;
  }
}

function main(canvas: HTMLCanvasElement, controls: HTMLDivElement) {
  configureCanvas(canvas);
  let isRunning = true;
  let elapsedTime = 0;
  let startTime = performance.now();
  const maxNumParticles = 50000;
  let numParticlesParam = createUIParameter("int", 1000, {
    name: "Particles",
    min: 10,
    max: maxNumParticles
  });
  let accumulateParam = createUIParameter("int", 1, {
    name: "Accumulate",
    min: 0,
    step: 1,
    max: 1
  });
  const controlFactory = new ControlFactory(document, controls);
  const gl = canvas.getContext("webgl2")!
  const ext = gl.getExtension("EXT_color_buffer_float");
  if (!ext) {
    throw new WebGLTextureError("This browser does not support rendering to float textures");
  }
  const simulateStage = stage_simulate.create(gl, maxNumParticles);
  //const testStage = stage_test.create(gl, canvas.width, canvas.height);
  const msaa = undefined; //4;
  const accumulateStage = stage_accumulate.create(gl, simulateStage, canvas.width, canvas.height, maxNumParticles, msaa);
  const postStage = stage_post.create(gl, accumulateStage);
  const displayStage = stage_display.create(gl, postStage);
  
  let frame = 0;

  function draw() {
    if (!isRunning) {
      return;
    }
    const time = elapsedTime + (performance.now() - startTime) / 1000;
    for (let i = 0; i < 2; i++) {
      const numParticles = numParticlesParam.value as number;
      const drawSize = textureSizeFromNumParticles(numParticles, maxNumParticles);
      stage_simulate.draw(gl, simulateStage, time, frame, drawSize);
      // stage_test.draw(gl, testStage);
      stage_accumulate.draw(gl, accumulateStage, time, frame, numParticles, accumulateParam.value as number === 0);
      stage_post.draw(gl, postStage, time, frame);
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

  createUi(controlFactory, [numParticlesParam, accumulateParam, ...simulateStage.parameters], 
    () => { resize(); }, 
    () => {
      isRunning = !isRunning;
      if (!isRunning) {
        elapsedTime = (performance.now() - startTime) / 1000;
      } else {
        startTime = performance.now();
        draw();
      }
    }
  );

  window.addEventListener("resize", resize);
  draw();
}

export default main;

// TODO:

// Add pulsating number of particles
// Consider adding LFOs
// Ensure strokes starts with alpha