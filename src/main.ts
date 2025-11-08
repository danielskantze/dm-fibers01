// import * as stage_test from "./render/stages/test";
//import * as stage_display from "./render/stages/display";
import defaultValues from "./config/defaultValues.json";
import { defaultParameters } from "./config/parameters";
import * as vec4 from "./math/vec4";
import { VideoRecorder, type RecorderStatus } from "./render/util/recorder";
import { WebGLRenderer } from "./render/webgl-renderer";
import { createAudioStatsCollector } from "./service/audio/audio-stats";
import { AudioPlayer } from "./service/audioplayer";
import { createRegistryFromConfig, type ParameterPreset } from "./service/parameters";
import type { BlobItemData, BlobStore } from "./service/storage";
import { IndexedDBBlobStore } from "./service/storage/localblob";
import { presetStore, userSettingsStore } from "./service/stores";
import type { ApplicationEvents } from "./types/application-events";
import { type Settings } from "./types/settings";
import { createRoot } from "./ui/root";
import { timestamp } from "./ui/util/date";
import { strToVec3 } from "./ui/util/seed";
import { Emitter, type EventMap } from "./util/events";

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

async function main(canvas: HTMLCanvasElement, controls: HTMLDivElement) {
  const emitter: Emitter<ApplicationEvents & EventMap> = new Emitter<
    ApplicationEvents & EventMap
  >();
  const params = createRegistryFromConfig(defaultParameters);
  configureCanvas(canvas);
  const renderer = new WebGLRenderer(settings, canvas, params, f => params.update(f));
  const userSettings = userSettingsStore.load();
  params.loadDefaults(defaultValues as ParameterPreset);
  const audioStore = new IndexedDBBlobStore("data", "audio");
  await audioStore.initialize();
  const audioStats = createAudioStatsCollector({
    enabledTypes: ["beat", "levels", "fft"],
    logConfig: undefined,
  });
  const audioPlayer = new AudioPlayer(audioStats);

  const uiRoot = createRoot({
    appEvents: emitter,
    element: controls,
    audioStore: audioStore,
    params,
    analyzer: audioStats,
    initialPresetId: userSettings.presetId,
    loadPresets: presetStore.load,
    savePresets: items => {
      presetStore.save(items);
    },
  });

  function init() {
    const seed = params.getBaseValue("main", "seed") as string;
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

  function onReset(clearAudio: boolean) {
    renderer.reset();
    renderer.pause();
    audioPlayer.stop(true);
    emitter.emit("transport", "stop");
    if (clearAudio) {
      audioPlayer.clear();
      emitter.emit("audio", { status: "clear" });
    }
  }

  async function start(audioStore: BlobStore) {
    await audioPlayer.initialize();

    const onSelectAudio = async (item: BlobItemData | undefined) => {
      if (item) {
        params.setValue("main", "audio", item.id);
        emitter.emit("audio", { status: "loading", id: item.id });
        return audioPlayer.load(item.data).then(() => {
          emitter.emit("audio", { status: "loaded", id: item.id });
        });
      }
    };

    const initAudio = async () => {
      const audioId = params.getBaseValue("main", "audio");
      if (audioId && (await audioStore.has(audioId as string))) {
        return onSelectAudio(await audioStore.get(audioId as string));
      } else {
        audioPlayer.stop();
        emitter.emit("audio", { status: "clear" });
      }
    };

    const selectPreset = async (item: ParameterPreset) => {
      const isRunning = renderer.isRunning;
      renderer.pause();
      params.load(item, { audioAnalyzer: audioStats });
      userSettingsStore.save({ presetId: item.id });
      audioPlayer.clear();
      init();
      await initAudio();
      if (isRunning) {
        audioPlayer.play();
        renderer.start();
      }
    };

    uiRoot.subscribe("selectAudio", ({ item }) => onSelectAudio(item));
    uiRoot.subscribe("selectPreset", ({ preset }) => selectPreset(preset));

    audioStats.events.subscribe("update", ({ stats }) => {
      const { rms, avgRms, avgPeak } = stats.levels;
      //params.setValue("main", "particles", 300000 * (0.5 + rms));
      params.setValue(
        "simulate",
        "audioLevelStats",
        vec4.create([rms, avgRms, avgPeak, stats.beat.timeSinceLastBeat])
      );
    });

    window.addEventListener("resize", resize);

    await initAudio();
    const initialPreset = presetStore.load().find(p => p.id === userSettings.presetId);
    if (initialPreset) {
      await selectPreset(initialPreset);
    }
    emitter.emit("transport", "stop");
    emitter.emit("status", {
      type: "ready",
      message: "Press space to start\nPress ctrl-. for menu",
    });

    uiRoot.subscribe("play", () => {
      emitter.emit("transport", onPlayPause() ? "playing" : "paused");
    });

    uiRoot.subscribe("screenshot", onScreenshot);
    uiRoot.subscribe("rec", () => {
      onRecord();
    });
    uiRoot.subscribe("stop", () => onReset(false));
    uiRoot.subscribe("seed", ({ seed }) => {
      onRandomSeed(seed);
    });
    uiRoot.subscribe("reset", () => onReset(true));
  }
  emitter.emit("status", { type: "loading", message: "Loading" });
  init();
  await start(audioStore);
  // LFOModifier.addTo(params.getParameter("simulate", "maxRadius"), {
  //   curve: "triangle",
  //   hz: 0.01,
  //   offset: 0.5,
  //   range: 0.5,
  //   phase: -0.25,
  // });
  // AudioAnalysisModifier.addTo(
  //   params.getParameter("simulate", "strokeNoise"),
  //   audioStats,
  //   {
  //     analysis: {
  //       type: "levels",
  //       property: "avgRms3",
  //       declineFalloff: 0.97,
  //     },
  //     range: 0.5,
  //     offset: -0.25,
  //   }
  // );
  /*
  LFOModifier.addTo(params.getParameter("main", "particles"), {
    hz: 0.01,
    range: 0.125,
    offset: 0.0,
    phase: 0.25,
  });
  */
  // AudioAnalysisModifier.addTo(params.getParameter("main", "particles"), audioStats, {
  //   analysis: {
  //     type: "levels",
  //     property: "avgRms3",
  //     declineFalloff: 0.97,
  //   },
  //   range: 0.75,
  //   //offset: -0.25,
  // });
  /*
  const pStrokeNoise = params.getParameter("simulate", "strokeNoise");
  LFOModifier.addTo(pStrokeNoise, {
    curve: "sine",
    hz: 0.0025,
    offset: 0.0,
    range: 0.5,
  });
  LFOModifier.addTo(pStrokeNoise, {
    curve: "triangle",
    hz: 0.0125,
    offset: -1.0,
    range: 1.5,
    phase: 0.25,
  });
  LFOModifier.addTo(params.getParameter("simulate", "colorNoise"), {
    curve: "triangle",
    hz: 0.0125,
    offset: 0.0,
    range: 0.5,
    phase: -0.25,
  });
  */
}

export default main;
