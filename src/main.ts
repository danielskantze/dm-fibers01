// import * as stage_test from "./render/stages/test";
import * as stage_accumulate from "./render/stages/accumulate";
import * as stage_blur from "./render/stages/blur";
import * as stage_combine from "./render/stages/combine";
//import * as stage_display from "./render/stages/display";
import defaultValues from "./config/defaultValues.json";
import { defaultParameters, defaultRenderConfig } from "./config/parameters";
import * as stage_luma from "./render/stages/luma";
import * as stage_materialize from "./render/stages/materialize";
import * as stage_output from "./render/stages/output";
import * as stage_simulate from "./render/stages/simulate";
import * as screenshot from "./render/util/screenshot";
import { ParameterRegistry, type ParameterPreset } from "./service/parameters";
import { presetStore } from "./service/stores";
import type { RenderingConfig } from "./types/config";
import { WebGLTextureError } from "./types/error";
import { type Settings } from "./types/settings";
import type { Stage, StageOutput } from "./types/stage";
import ControlFactory from "./ui/components/controls";
import { createUi } from "./ui/views/parameter-panel";
import { timestamp } from "./ui/util/date";


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


function configureCanvas(canvas: HTMLCanvasElement) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = window.devicePixelRatio;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}


function textureSizeFromNumParticles(numParticles: number, maxNumParticles: number): [number, number] {
  let pts = numParticles;
  if (pts > maxNumParticles) {
    pts = maxNumParticles;
  }
  const w = Math.floor(Math.sqrt(pts));
  return [w, w];
}

function createRenderingStages(gl: WebGL2RenderingContext, maxNumParticles: number, maxBloomSteps: number, renderWidth: number, renderHeight: number, params: ParameterRegistry): RenderingStages {
  const simulate = stage_simulate.create(gl, maxNumParticles);
  const materialize = stage_materialize.create(gl, simulate, renderWidth, renderHeight, maxNumParticles, settings.msaa);
  const accumulate = stage_accumulate.create(gl, materialize);
  const luma = stage_luma.create(gl, accumulate);
  const blur = stage_blur.create(gl, luma, "low", maxBloomSteps);
  const combine = stage_combine.create(gl, accumulate);
  const display = stage_output.create(gl, combine, false);
  const screenshot = stage_output.create(gl, combine, true);
  
  Object.keys(simulate.parameters).forEach((k) => (
    params.register(simulate.name, k, simulate.parameters[k]))
  );

  Object.keys(accumulate.parameters).forEach((k) => (
    params.register(accumulate.name, k, accumulate.parameters[k]))
  );

  return {
    simulate, materialize, accumulate, luma, blur, combine, display, screenshot
  }
}

function configureRenderingStages(config: RenderingConfig, stages: RenderingStages) {
  if (config.bloomQuality > 0) {
    stages.display.input = stages.combine;
    stages.screenshot.input = stages.combine;
  } else {
    stages.display.input = stages.accumulate;
    stages.screenshot.input = stages.accumulate;
  }
}

type BloomStageParams = {
  lumaThreshold: number,
  bloomIntensity: number,
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
  const { width, height, stages: { bloom } } = state;
  const blurQuality = stage_blur.lookupBlurQuality(config.bloomQuality);
  if (blurQuality !== "off") {
    stage_luma.draw(gl, stages.luma, bloom.lumaThreshold);
    stage_blur.draw(gl, stages.blur, undefined, config.bloomSteps, blurQuality);
    stage_combine.draw(gl, stages.combine, stages.blur, 1.0, bloom.bloomIntensity);
  }
  if (screenshot) {
    stage_output.draw(gl, stages.screenshot);
  } else {
    stage_output.draw(gl, stages.display, width, height);
  }
}

function main(canvas: HTMLCanvasElement, controls: HTMLDivElement) {
  const params = ParameterRegistry.fromConfig(defaultParameters);
  const renderConfig = defaultRenderConfig;

  configureCanvas(canvas);

  let isRunning = true;
  let elapsedTime = 0;
  let startTime = performance.now();
  
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

  const stages = createRenderingStages(gl, renderConfig.maxNumParticles, renderConfig.maxBloomSteps, renderWidth, renderHeight, params);

  let frame = 0;

  configureRenderingStages(renderConfig, stages);

  params.load(defaultValues as ParameterPreset);
  

  function render(screenshot: boolean = false) {
    const bloomSteps = params.getNumberValue("bloom", "steps");
    const bloomQuality = params.getNumberValue("bloom", "quality");

    if (bloomSteps !== renderConfig.bloomSteps) {
      renderConfig.bloomSteps = bloomSteps;
      configureRenderingStages(renderConfig, stages);
    }
    if (bloomQuality !== renderConfig.bloomQuality) {
      renderConfig.bloomQuality = bloomQuality;
      configureRenderingStages(renderConfig, stages);
    }
    renderConfig.updatesPerDraw = params.getNumberValue("main", "updatesPerDraw");

    const renderingState: RenderingState = {
      time: elapsedTime + (performance.now() - startTime) / 1000,
      frame,
      numParticles: params.getNumberValue("main", "particles"),
      stages: {
        bloom: {
          lumaThreshold: params.getNumberValue("bloom", "luma"),
          bloomIntensity: params.getNumberValue("bloom", "intensity"),
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

  function onScreenshot() {
    if (!isRunning) {
      startTime = performance.now();
    }
    render(true);
    downloadScreenshot(screenshot.getTexturePng(gl, stages.screenshot.resources.output as StageOutput));
    if (!isRunning) {
      elapsedTime += (performance.now() - startTime) / 1000;
    }
  }

  function onPause() {
    isRunning = !isRunning;
    if (!isRunning) {
      elapsedTime += (performance.now() - startTime) / 1000;
    } else {
      startTime = performance.now();
      draw();
    }
  }

  function onToggleVisibility() {
    controlFactory.visible = !controlFactory.visible;
  }

  createUi({
    element: controls,
    params,
    loadPresets: presetStore.load,
    savePresets: presetStore.save,
    onScreenshot,
    onPause,
    onToggleVisibility,
  });

  window.addEventListener("resize", resize);
  draw();
}

export default main;

// TODO:

// Refactoring cont'd (is this needed?):
// - Consider doing more to keep footprint of main.ts small
// - Improve UI code quality (use interfaces, improve method to put the UI together)

// Migrate all vectors and math classes to use Float32Arrays instead of number[]

// Store parameters
// Support storing and loading list of parameters from localStorage
// Cleanup parameter access pattern in main (type, use keyeof?)
// RenderingSettings vs RenderingConfig clarify, improve typing separation
// Maybe: Support parameter groups in UI
// Handle outdated parameters (wrong version)

// Random seed

// Add music.
// - Sync beats with stroke noise x/y (each kick will pulse these)
// - Also pulsate stroke radius (maybe for a new section?)
// - Possibly tune palette x/y too
// - Experiment with syncing particle start time too (high intensity - particle restarts immediately)
// - And of course, test controlling number of particles (possibly relate to radius)

// 3D support (each particle has Z component)

// Group parameters of different types (e.g. bloom)

// Consider adding LFOs
// Support brightness, contrast and color temperature post controls
// Consider removing support for bloom 
// Make post chain pluggable and easier to rearrange (array of steps)