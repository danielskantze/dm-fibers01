// import * as stage_test from "./render/stages/test";
//import * as stage_display from "./render/stages/display";
import defaultValues from "./config/defaultValues.json";
import { defaultParameters } from "./config/parameters";
import { VideoRecorder, type RecorderStatus } from "./render/util/recorder";
import { WebGLRenderer } from "./render/webgl-renderer";
import { createRegistryFromConfig, type ParameterPreset } from "./service/parameters";
import { presetStore } from "./service/stores";
import type { ApplicationDispatcher, ApplicationEvents, ApplicationRecordEvents, ApplicationTransportEvents } from "./types/application-events";
import { type Settings } from "./types/settings";
import ControlFactory from "./ui/components/controls";
import { timestamp } from "./ui/util/date";
import { strToVec3 } from "./ui/util/seed";
import { createUi } from "./ui/views/parameter-panel";
import { Dispatcher } from "./util/events";

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

function downloadRecording(buffer: ArrayBuffer) {
  const aElmt = document.createElement("a");
  const blob = new Blob([buffer], { type: "video/mp4" });
  const objectUrl = window.URL.createObjectURL(blob);
  aElmt.download = `fibers-${timestamp()}`;
  aElmt.href = objectUrl;
  aElmt.click();
  window.URL.revokeObjectURL(objectUrl);
}

function main(canvas: HTMLCanvasElement, controls: HTMLDivElement) {
  const appDispatcher: ApplicationDispatcher = new Dispatcher<ApplicationEvents>();
  const params = createRegistryFromConfig(defaultParameters);
  configureCanvas(canvas);
  const controlFactory = new ControlFactory(controls);
  const renderer = new WebGLRenderer(settings, canvas, params);
  params.load(defaultValues as ParameterPreset);
  init();

  function init() {
    const seed = (params.getParameter("main", "seed").value ?? "") as string;
    onRandomSeed(seed);
  }

  function resize() {
    configureCanvas(canvas);
  }

  function onScreenshot() {
    const imageData = renderer.screenshot();
    downloadScreenshot(imageData);
  }

  async function onRecord(): Promise<void> {
    if (renderer.recorder) {
      appDispatcher.notify("record", "waiting" as ApplicationRecordEvents);
      const buffer = await renderer.recorder.stop();
      if (buffer) {
        renderer.recorder = null;
        downloadRecording(buffer);
      }
      appDispatcher.notify("record", "idle" as ApplicationRecordEvents);
    } else {
      const recorder = new VideoRecorder(canvas, {
          title: "DM Fibers 01"
        }
      );
      appDispatcher.notify("record", "waiting" as ApplicationRecordEvents);
      recorder.start();
      const onRecorderStatusChange = (status: RecorderStatus) => {
        if (status === "ready") {
          renderer.recorder = recorder;
          recorder.dispatcher.unsubscribe(onRecorderStatusChange);
        }
        appDispatcher.notify("record", "recording" as ApplicationRecordEvents);
      }
      recorder.dispatcher.subscribe("status", onRecorderStatusChange);
    }
  }

  function onPause() {
    renderer.isRunning ? renderer.pause() : renderer.start();
    return renderer.isRunning;
  }

  function onRandomSeed(seed: string) {
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
    appDispatcher,
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

  dispatcher.subscribe("pause", () => {
    const status: ApplicationTransportEvents = onPause() ? "paused" : "playing";
    appDispatcher.notify("transport", status);
  });

  dispatcher.subscribe("screenshot", onScreenshot);
  dispatcher.subscribe("rec", () => { onRecord(); });
  dispatcher.subscribe("seed", onRandomSeed);
  dispatcher.subscribe("reset", onReset);

  window.addEventListener("resize", resize);
  renderer.start();
}

export default main;

// TODO:

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
