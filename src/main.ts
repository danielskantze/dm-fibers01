// import * as stage_test from "./render/stages/test";
import type { Matrix4x3, Vec3 } from "./math/types";
import * as stage_accumulate from "./render/stages/accumulate";
import * as stage_blur from "./render/stages/blur";
import * as stage_combine from "./render/stages/combine";
//import * as stage_display from "./render/stages/display";
import * as stage_luma from "./render/stages/luma";
import * as stage_materialize from "./render/stages/materialize";
import * as stage_simulate from "./render/stages/simulate";
import * as stage_output from "./render/stages/output";
import { WebGLTextureError } from "./types/error";
import { UniformComponents, type Uniform, type UniformType, type UniformUI } from "./types/gl/uniforms";
import { type Settings } from "./types/settings";
import type { Stage, StageOutput } from "./types/stage";
import { createButtons } from "./ui/components/buttons";
import { createCosPalette } from "./ui/components/cos-palette";
import { createScalar } from "./ui/components/scalar";
import { createVec3 } from "./ui/components/vec3";
import { createVector } from "./ui/components/vector";
import ControlFactory from "./ui/controls";
import { timestamp } from "./ui/util/date";
import * as screenshot from "./render/util/screenshot";

export type ControlFactoryUniform = Omit<Uniform, "location" | "slot">;

const settings: Settings = {
  width: window.screen.width,
  height: window.screen.height,
  msaa: undefined
}

type RenderingStages = {
  simulate: Stage,
  materialize: Stage,
  accumulate: Stage,
  luma: Stage,
  blur: Stage,
  combine: Stage,
  display: Stage,
  screenshot: Stage
};

type RenderingConfig = {
  maxNumParticles: number,
  useBloom: boolean,
  updatesPerDraw: number
}

function configureCanvas(canvas: HTMLCanvasElement) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = window.devicePixelRatio;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}

function createUniformControls(controlsContainer: HTMLElement, uniforms: ControlFactoryUniform[]) {
  for (const u of uniforms) {
    const { ui } = u;
    if (ui) {
      const { name, min, max, step, component } = u.ui!;
      const numComponents = UniformComponents[u.type!]!;
      if (component === "cos-palette") {
        controlsContainer.appendChild(
          createCosPalette(u.value as Matrix4x3)
        )
      } else if (numComponents > 1) {
        const values = u.value as number[];
        if (numComponents === 3) {
          controlsContainer.appendChild(
            createVec3(name, values as Vec3,
              (v: Vec3) => {
                values[0] = v[0];
                values[1] = v[1];
                values[2] = v[2];
              }
            )
          );
        } else {
          controlsContainer.appendChild(createVector(name, values, (i: number, v: number) => { values[i] = v; }, min, max, step));
        }
      } else {
        const value = u.value as number;
        controlsContainer.appendChild(createScalar(name, value, (v: number) => { u.value = v; }, min, max, step));
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
  controlsContainer: HTMLElement,
  parameters: ControlFactoryUniform[],
  resetFn: () => void,
  pauseFn: () => void,
  toggleVisibilityFn: () => void,
) {
  createUniformControls(controlsContainer, parameters);
  controlsContainer.appendChild(createButtons([
    {
      title: "Screenshot", 
      onClick: resetFn,
      color: 2
    },
    { 
      title: "Pause", 
      onClick: pauseFn, 
      color: 2 
    }
  ]));

  document.addEventListener("keypress", (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key.charCodeAt(0) === 112) { // 112 = p
      toggleVisibilityFn();
    }
  });
}

function createUIParameter(type: UniformType, value: number | number[], ui: UniformUI): ControlFactoryUniform {
  return { type, value, ui };
}

function createRenderingStages(gl: WebGL2RenderingContext, maxNumParticles: number, renderWidth: number, renderHeight: number): RenderingStages {
  const simulate = stage_simulate.create(gl, maxNumParticles);
  const materialize = stage_materialize.create(gl, simulate, renderWidth, renderHeight, maxNumParticles, settings.msaa);
  const accumulate = stage_accumulate.create(gl, materialize);
  const luma = stage_luma.create(gl, accumulate);
  const blur = stage_blur.create(gl, luma, "high", 7);
  const combine = stage_combine.create(gl, accumulate);
  const display = stage_output.create(gl, combine, false);
  const screenshot = stage_output.create(gl, combine, true);
  return {
    simulate, materialize, accumulate, luma, blur, combine, display, screenshot
  }
}

function configureRenderingStages(config: RenderingConfig, stages: RenderingStages) {
  if (config.useBloom) {
    stages.display.input = stages.combine;
    stages.screenshot.input = stages.combine;
  } else {
    stages.display.input = stages.accumulate;
    stages.screenshot.input = stages.accumulate;
  }
}

type BloomStageParams = {
  lumaThreshold: number,
  bloomIntensity: number
}

type RenderingState = {
  time: number,
  frame: number,
  width: number,
  height: number,
  numParticles: number,
  stages: {
    bloom: BloomStageParams
  }
}

function updateSimulationStages(gl: WebGL2RenderingContext, config: RenderingConfig, stages: RenderingStages, state: RenderingState) {
  const { maxNumParticles } = config;
  const { time, frame, numParticles } = state;
  const drawSize = textureSizeFromNumParticles(numParticles, maxNumParticles);
  stage_simulate.draw(gl, stages.simulate, time, frame, drawSize);
  stage_materialize.draw(gl, stages.materialize, time, frame, numParticles);
  stage_accumulate.draw(gl, stages.accumulate, time, frame);
}

function downloadScreenshot(dataURL: string) {
  const aElmt = document.createElement("a");
  aElmt.download = `fibers-${timestamp()}`;
  aElmt.href = dataURL;
  aElmt.click();
}

function drawOutputStages(gl: WebGL2RenderingContext, config: RenderingConfig, stages: RenderingStages, state: RenderingState, screenshot: boolean = false) {
  const { useBloom } = config;
  const { width, height, stages: { bloom } } = state;
  if (useBloom) {
    stage_luma.draw(gl, stages.luma, bloom.lumaThreshold);
    stage_blur.draw(gl, stages.blur);
    stage_combine.draw(gl, stages.combine, stages.blur, 1.0, bloom.bloomIntensity);
  }
  if (screenshot) {
    stage_output.draw(gl, stages.screenshot);
  } else {
    stage_output.draw(gl, stages.display, width, height);
  }
}

function main(canvas: HTMLCanvasElement, controls: HTMLDivElement) {
  configureCanvas(canvas);
  let isRunning = true;
  let elapsedTime = 0;
  let startTime = performance.now();
  const maxNumParticles = 4 * 50000;
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
  let bloomIntensityParam = createUIParameter("float", 0.5, {
    name: "Bloom Intensity",
    min: 0,
    step: 0.01,
    max: 1.0
  });
  let lumaThresholdParam = createUIParameter("float", 0.25, {
    name: "Luma",
    min: 0,
    step: 0.01,
    max: 1.0
  });
  let useBloomParam = createUIParameter("int", 0, {
    name: "Bloom",
    min: 0,
    max: 1,
    step: 1
  });
  let updatesPerDrawParam = createUIParameter("int", 4, {
    name: "Updates / Draw",
    min: 1,
    max: 10,
    step: 1
  });
  const controlFactory = new ControlFactory(controls);
  const gl = canvas.getContext("webgl2")!;
  let ext = gl.getExtension("EXT_color_buffer_float");
  if (!ext) {
    throw new WebGLTextureError("This browser does not support rendering to float textures");
  }
  ext = gl.getExtension("EXT_color_buffer_half_float");
  if (!ext) {
    throw new WebGLTextureError("This browser does not support rendering to half float textures");
  }
  const dpr = window.devicePixelRatio;
  const renderWidth = settings.width * dpr;
  const renderHeight = settings.height * dpr;

  const stages = createRenderingStages(gl, maxNumParticles, renderWidth, renderHeight);

  let frame = 0;

  const renderConfig: RenderingConfig = {
    maxNumParticles,
    useBloom: (useBloomParam.value as number) === 1,
    updatesPerDraw: 4
  };

  configureRenderingStages(renderConfig, stages);

  function render(screenshot: boolean = false) {
    const useBloom = (useBloomParam.value as number) === 1;
    if (useBloom !== renderConfig.useBloom) {
      renderConfig.useBloom = useBloom;
      configureRenderingStages(renderConfig, stages);
    }
    renderConfig.updatesPerDraw = updatesPerDrawParam.value as number;

    const renderingState: RenderingState = {
      time: elapsedTime + (performance.now() - startTime) / 1000,
      frame,
      numParticles: numParticlesParam.value as number,
      stages: {
        bloom: {
          lumaThreshold: lumaThresholdParam.value as number,
          bloomIntensity: bloomIntensityParam.value as number
        }
      },
      width: canvas.width,
      height: canvas.height
    };
    for (let i = 0; i < renderConfig.updatesPerDraw; i++) {
      renderingState.frame = frame;
      updateSimulationStages(gl, renderConfig, stages, renderingState);
      frame++;
    }
    drawOutputStages(gl, renderConfig, stages, renderingState, screenshot);
  }

  function draw() {
    if (!isRunning) {
      return;
    }
    render();
    requestAnimationFrame(() => {
      draw();
    });
  }

  function resize() {
    configureCanvas(canvas);
  }
  createUi(controls, [numParticlesParam, accumulateParam, updatesPerDrawParam, useBloomParam, bloomIntensityParam, lumaThresholdParam, ...stages.simulate.parameters, ...stages.accumulate.parameters],
    () => {
      if (!isRunning) {
        startTime = performance.now();
      }
      render(true);
      downloadScreenshot(screenshot.getTexturePng(gl, stages.screenshot.resources.output as StageOutput));
      if (!isRunning) {
        elapsedTime += (performance.now() - startTime) / 1000;
      }
    },
    () => {
      isRunning = !isRunning;
      if (!isRunning) {
        elapsedTime += (performance.now() - startTime) / 1000;
      } else {
        startTime = performance.now();
        draw();
      }
    },
    () => {
      controlFactory.visible = !controlFactory.visible;
    }
  );

  window.addEventListener("resize", resize);
  draw();
}

export default main;

// TODO:

// Store parameters

// Bloom quality parameters
// Better control for boolean parameters
// Group parameters of different types (e.g. bloom)
// Random seed
// Make vector field less jittery

// Add music.
// - Sync beats with stroke noise x/y (each kick will pulse these)
// - Also pulsate stroke radius (maybe for a new section?)
// - Possibly tune palette x/y too
// - Experiment with syncing particle start time too (high intensity - particle restarts immediately)
// - And of course, test controlling number of particles (possibly relate to radius)

// 3D support (each particle has Z component)

// Consider adding LFOs

// Make post chain pluggable and easier to rearrange (array of steps)