// import * as stage_test from "./render/stages/test";
//import * as stage_display from "./render/stages/display";
import defaultValues from "./config/defaultValues.json";
import { defaultParameters } from "./config/parameters";
import { VideoRecorder, type RecorderStatus } from "./render/util/recorder";
import { WebGLRenderer } from "./render/webgl-renderer";
import { AudioPlayer } from "./service/audioplayer";
import { createRegistryFromConfig, type ParameterPreset } from "./service/parameters";
import type { BlobItemData, BlobStore } from "./service/storage";
import { IndexedDBBlobStore } from "./service/storage/localblob";
import { presetStore } from "./service/stores";
import type { ApplicationEvents } from "./types/application-events";
import { type Settings } from "./types/settings";
import ControlFactory from "./ui/components/controls";
import { timestamp } from "./ui/util/date";
import { strToVec3 } from "./ui/util/seed";
import { createUi } from "./ui/views/parameter-panel";
import { Emitter } from "./util/events";
import * as vec4 from "./math/vec4";
import { createAudioStatsCollector } from "./service/audio/audio-stats";

const settings: Settings = {
  width: window.screen.width,
  height: window.screen.height,
  dpr: window.devicePixelRatio,
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
  const emitter: Emitter<ApplicationEvents> = new Emitter<ApplicationEvents>();
  const params = createRegistryFromConfig(defaultParameters);
  configureCanvas(canvas);
  const controlFactory = new ControlFactory(controls);
  const renderer = new WebGLRenderer(settings, canvas, params);
  params.load(defaultValues as ParameterPreset);
  const audioStore = new IndexedDBBlobStore("data", "audio");
  const audioStats = createAudioStatsCollector({
    enabledTypes: ["beat", "levels", "fft"],
    logConfig: {
      interval: 0.5,
      types: ["levels", "beat"],
    },
  });
  const audioPlayer = new AudioPlayer(audioStats);

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
      emitter.emit("record", "waiting");
      const buffer = await renderer.recorder.stop();
      if (buffer) {
        renderer.recorder = null;
        downloadRecording(buffer);
      }
      emitter.emit("record", "idle");
    } else {
      const recorder = new VideoRecorder(canvas, {
        title: "DM Fibers 01",
      });
      emitter.emit("record", "waiting");
      recorder.start();
      const onRecorderStatusChange = (status: RecorderStatus) => {
        if (status === "ready") {
          renderer.recorder = recorder;
          recorder.events.unsubscribe("status", onRecorderStatusChange);
        }
        emitter.emit("record", "recording");
      };
      recorder.events.subscribe("status", onRecorderStatusChange);
    }
  }

  function onPlayPause() {
    if (renderer.isRunning) {
      if (audioPlayer.ready) {
        audioPlayer.stop();
      }
      renderer.pause();
    } else {
      if (audioPlayer.ready) {
        audioPlayer.play();
      }
      renderer.start();
    }
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
    audioPlayer.clear();
    emitter.emit("audio", { status: "clear" });
  }

  function onToggleVisibility() {
    controlFactory.visible = !controlFactory.visible;
  }

  async function start(audioStore: BlobStore) {
    await audioPlayer.initialize();

    const onSelectAudio = (item: BlobItemData | undefined) => {
      if (item) {
        params.setValue("main", "audio", item.id);
        emitter.emit("audio", { status: "loading", id: item.id });
        audioPlayer.load(item.data).then(() => {
          emitter.emit("audio", { status: "loaded", id: item.id });
        });
      }
    };

    const initAudio = async () => {
      const audioId = params.getParameter("main", "audio")?.value;
      if (audioId && (await audioStore.has(audioId as string))) {
        onSelectAudio(await audioStore.get(audioId as string));
      } else {
        audioPlayer.stop();
        emitter.emit("audio", { status: "clear" });
      }
    };
    const uiEvents = createUi({
      appEvents: emitter,
      element: controls,
      audioStore: audioStore,
      params,
      selectPreset: (item: ParameterPreset) => {
        params.load(item);
        audioPlayer.clear();
        init();
        initAudio();
      },
      loadPresets: presetStore.load,
      savePresets: presetStore.save,
      onToggleVisibility,
      onSelectAudio,
    });

    uiEvents.subscribe("play", () => {
      emitter.emit("transport", onPlayPause() ? "playing" : "paused");
    });

    uiEvents.subscribe("screenshot", onScreenshot);
    uiEvents.subscribe("rec", () => {
      onRecord();
    });
    uiEvents.subscribe("seed", ({ seed }) => {
      onRandomSeed(seed);
    });
    uiEvents.subscribe("reset", onReset);

    audioStats.events.subscribe("update", ({ stats }) => {
      const { rms, peak, avgRms, avgPeak } = stats.levels;
      //params.setValue("main", "particles", 300000 * (0.5 + rms));
      params.setValue(
        "simulate",
        "audioLevelStats",
        vec4.create([rms, avgRms, avgPeak, stats.beat.timeSinceLastBeat])
      );
    });

    window.addEventListener("resize", resize);
    emitter.emit("transport", renderer.isRunning ? "playing" : "paused");
    await initAudio();
    onPlayPause();
  }

  init();
  audioStore.initialize().then(() => start(audioStore));
}

export default main;

// TODO:

// Figure out a way to connect number of particles to sound intensity
// - windowed average

// Math
// - Add smoothing and damping functions

// Figure out how relative parameters should work

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

// Ensure preset is recalled properly and that audio file is loaded too
// Migrate all vectors and math classes to use Float32Arrays instead of number[]
// Handle outdated parameters (wrong version)
// 3D support (each particle has Z component)
// Group parameters of different types (e.g. bloom)
// Consider adding LFOs
// Support brightness, contrast and color temperature post controls
