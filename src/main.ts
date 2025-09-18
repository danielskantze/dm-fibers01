// import * as stage_test from "./render/stages/test";
import * as stage_simulate from "./render/stages/simulate";
import * as stage_materialize from "./render/stages/materialize";
import * as stage_accumulate from "./render/stages/accumulate";
import * as stage_blur from "./render/stages/blur";
import * as stage_combine from "./render/stages/combine";
import * as stage_display from "./render/stages/display";
import { WebGLTextureError } from "./types/error";
import { UniformComponents, type UniformType, type UniformUI } from "./types/gl/uniforms";
import ControlFactory, { type ControlFactoryUniform } from "./ui/controls";
import type { Stage } from "./types/stage";

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
  factory.createCosPalette([[0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5],
      [1.0, 1.0, 1.0],
      [0.0, 0.9, 0.9]]);
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
  const maxNumParticles = 8 * 50000;
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
  const msaa = undefined
  const materializeStage = stage_materialize.create(gl, simulateStage, canvas.width, canvas.height, maxNumParticles, msaa);
  const accumulateStage = stage_accumulate.create(gl, materializeStage);
  const displayStage = stage_display.create(gl, accumulateStage);
  /*
  const blurStages: Stage[] = [];
  for (let inpStage = materializeStage, i = 0; i < (3 * 2); i++) {
    inpStage = stage_blur.create(gl, inpStage);
    blurStages.push(inpStage);
  }
  
  const combineStage = stage_combine.create(gl, materializeStage);
  const displayStage = stage_display.create(gl, combineStage);
  //const displayStage = stage_display.create(gl, materializeStage);
  */
  let frame = 0;

  function draw() {
    if (!isRunning) {
      return;
    }
    const time = elapsedTime + (performance.now() - startTime) / 1000;
    for (let i = 0; i < 4; i++) {
      const numParticles = numParticlesParam.value as number;
      const drawSize = textureSizeFromNumParticles(numParticles, maxNumParticles);
      stage_simulate.draw(gl, simulateStage, time, frame, drawSize);
      stage_materialize.draw(gl, materializeStage, time, frame, numParticles);
      stage_accumulate.draw(gl, accumulateStage, time, frame);
      //stage_blur.draw(gl, blurHStage, time, frame, [1.0, 0.0]);
      //stage_blur.draw(gl, blurVStage, time, frame, [0.0, 1.0]);
      // blurStages.forEach((s, i) => {
      //   stage_blur.draw(gl, s, time, frame, i % 2 === 0 ? [1 + i >> 1, 0] : [0, 1 + i >> 1]);
      // });

      // stage_combine.draw(gl, combineStage, [blurStages[1], blurStages[3], blurStages[5]]);
      stage_display.draw(gl, displayStage);
      frame++;
    }
    requestAnimationFrame(() => { 
      draw();
    });
  }

  function resize() {
    configureCanvas(canvas);
    stage_materialize.resize(gl, canvas.width, canvas.height, materializeStage);
    //stage_accumulate.resize(gl, accumulateStage);
    //stage_blur.resize(gl, blurStage);
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


// Palette editor
// Palette "compressor" - ensure equal brightness
// Widen spatial spread (currently it seems like all strokes roughly has the same color)

// Add pulsating number of particles
// Consider adding LFOs
 // Add bloom filter step (think of other post processing effects, e.g. motion blur)