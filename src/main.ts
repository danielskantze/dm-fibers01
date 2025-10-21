// import * as stage_test from "./render/stages/test";
//import * as stage_display from "./render/stages/display";
import defaultValues from "./config/defaultValues.json";
import { defaultParameters } from "./config/parameters";
import { WebGLRenderer } from "./render/webgl-renderer";
import { createRegistryFromConfig, type ParameterPreset } from "./service/parameters";
import { presetStore } from "./service/stores";
import { type Settings } from "./types/settings";
import ControlFactory from "./ui/components/controls";
import { timestamp } from "./ui/util/date";
import { strToVec3 } from "./ui/util/seed";
import { createUi } from "./ui/views/parameter-panel";

const settings: Settings = {
  width: window.screen.width,
  height: window.screen.height,
  dpr: window.devicePixelRatio,
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
  const params = createRegistryFromConfig(defaultParameters);
  configureCanvas(canvas);
  const controlFactory = new ControlFactory(controls);
  const renderer = new WebGLRenderer(settings, canvas, params);
  params.load(defaultValues as ParameterPreset);
  init();

  function init() {
    const seed = (params.getParameter("main", "seed").value ?? "") as string;
    onRandomSeed("", seed);
  }

  function resize() {
    configureCanvas(canvas);
  }

  function onScreenshot() {
    const imageData = renderer.screenshot();
    downloadScreenshot(imageData);
  }

  function onPause() {
    renderer.isRunning ? renderer.pause() : renderer.start();
    return renderer.isRunning;
  }

  function onRandomSeed(_event: string, seed: string) {
    const v = strToVec3(seed);
    params.setValue("simulate", "randomSeed", v);
    params.setValue("main", "seed", seed);
    renderer.reset();
  }

  function onReset() {
    renderer.reset();
  }

  function onToggleVisibility() {
    controlFactory.visible = !controlFactory.visible;
  }

  const dispatcher = createUi({
    element: controls,
    params,
    selectPreset: (item: ParameterPreset) => {
      params.load(item);
      init();
    },
    loadPresets: presetStore.load,
    savePresets: presetStore.save,
    onToggleVisibility,
  });

  dispatcher.subscribe("pause", (_, isPaused: boolean[]) => {
    isPaused[0] = onPause();
  });

  dispatcher.subscribe("screenshot", onScreenshot);
  dispatcher.subscribe("seed", onRandomSeed);
  dispatcher.subscribe("reset", onReset);

  window.addEventListener("resize", resize);
  renderer.start();
}

export default main;

// TODO:

// - [ ] Support video encoding
// - [ ] Better play pause resume buttons
// - [ ] Rename presets


// Simple add music (hook up to audio features)
// - Sync beats with stroke noise x/y (each kick will pulse these)
// - Also pulsate stroke radius (maybe for a new section?)
// - Possibly tune palette x/y too
// - Experiment with syncing particle start time too (high intensity - particle restarts immediately)
// - And of course, test controlling number of particles (possibly relate to radius)

// Hook up midi parameters

// Hook up music timeline file

// Refactoring cont'd (is this needed?):
// - Improve UI code quality (use interfaces, improve method to put the UI together)

// Migrate all vectors and math classes to use Float32Arrays instead of number[]
// Maybe: Support parameter groups in UI
// Handle outdated parameters (wrong version)


// 3D support (each particle has Z component)

// Group parameters of different types (e.g. bloom)

// Consider adding LFOs
// Support brightness, contrast and color temperature post controls
// Consider removing support for bloom 
// Make post chain pluggable and easier to rearrange (array of steps)