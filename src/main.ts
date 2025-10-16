// import * as stage_test from "./render/stages/test";
//import * as stage_display from "./render/stages/display";
import defaultValues from "./config/defaultValues.json";
import { defaultParameters, defaultRenderConfig } from "./config/parameters";
import * as screenshot from "./render/util/screenshot";
import { ParameterRegistry, type ParameterPreset } from "./service/parameters";
import { presetStore } from "./service/stores";
import { WebGLTextureError } from "./types/error";
import { type Settings } from "./types/settings";
import type { StageOutput } from "./types/stage";
import ControlFactory from "./ui/components/controls";
import { createUi } from "./ui/views/parameter-panel";
import { timestamp } from "./ui/util/date";
import { createRenderingStages, configureRenderingStages, updateSimulationStages, drawOutputStages } from "./render/webgl-renderer";
import type { CreateRenderingStagesProps, RenderingState } from "./render/webgl-renderer";

const settings: Settings = {
  width: window.screen.width,
  height: window.screen.height,
  msaa: undefined
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


function downloadScreenshot(dataURL: string) {
  const aElmt = document.createElement("a");
  aElmt.download = `fibers-${timestamp()}`;
  aElmt.href = dataURL;
  aElmt.click();
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
  
  const renderingStagesProps: CreateRenderingStagesProps = {
    gl,
    maxNumParticles: renderConfig.maxNumParticles,
    maxBloomSteps: renderConfig.maxBloomSteps,
    renderWidth,
    renderHeight,
    params,
    settings,
  }

  const stages = createRenderingStages(renderingStagesProps);

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