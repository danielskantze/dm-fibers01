import type { Vec3 } from "../../../math/types";
import * as vec3 from "../../../math/vec3";
import type {
  AudioAnalysisEvents,
  PublicAudioStatsCollector,
} from "../../../service/audio/audio-stats";
import type { LevelsMonitorState } from "../../../service/audio/levels-monitor";
import type { Handler } from "../../../util/events";

export function createAudioVisualizer(
  analyzer: PublicAudioStatsCollector,
  width: number,
  height: number,
  maxBins: number = 64
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const w = Math.floor(width * window.devicePixelRatio);
  const h = Math.floor(height * window.devicePixelRatio);
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${Math.round(width)}px`;
  canvas.style.height = `${Math.round(height)}px`;
  canvas.style.position = "fixed";
  canvas.style.bottom = "0";
  canvas.style.left = "0";
  canvas.style.zIndex = "1000";
  canvas.style.backgroundColor = "black";

  let levelStats: LevelsMonitorState;
  let timeSinceLastBeat: number;
  let levelStatKeys: (keyof LevelsMonitorState)[] = [
    "peak",
    "rms",
    "avgPeak",
    "avgRms",
    "avgRms3",
    "avgRms5",
  ];

  let buffer = new Float32Array(maxBins);
  const vuColors: [Vec3, Vec3, Vec3] = [
    vec3.fromValues(0, 255, 0),
    vec3.fromValues(255, 255, 0),
    vec3.fromValues(255, 0, 0),
  ];
  const beatColors: [Vec3, Vec3, Vec3] = [
    vec3.fromValues(0, 0, 0),
    vec3.fromValues(128, 128, 128),
    vec3.fromValues(255, 0, 255),
  ];
  const tmpC = vec3.createZero();

  ctx.fillStyle = "white";

  const colorAt = (amplitude: number, colors: [Vec3, Vec3, Vec3]) => {
    const p = amplitude * amplitude;
    if (p < 0.5) {
      vec3.mixO(colors[0], colors[1], tmpC, p * 2.0);
    } else {
      vec3.mixO(colors[1], colors[2], tmpC, (p - 0.5) * 2.0);
    }
    return `rgb(${Math.floor(tmpC[0])}, ${Math.floor(tmpC[1])}, ${Math.floor(tmpC[2])})`;
  };

  const drawSpectrum = (x: number, width: number, gap: number) => {
    const bw = width / maxBins;
    for (let i = 0; i < maxBins; i++) {
      const bx = i * bw + x;
      const a = buffer[i];
      const bh = a * h;
      ctx.fillStyle = colorAt(a, vuColors);
      ctx.fillRect(bx + gap, h - bh, bw - gap - gap, bh);
    }
  };

  const drawLevels = (x: number, width: number, gap: number) => {
    const numBars = levelStatKeys.length;
    const bw = width / Object.keys(levelStats).length;
    for (let i = 0; i < numBars; i++) {
      const bx = i * bw + x;
      const a = levelStats[levelStatKeys[i]];
      let bh = a * h;
      ctx.fillStyle = colorAt(a, vuColors);
      ctx.fillRect(bx + gap, h - bh, bw - gap - gap, bh);
    }
  };

  const drawBeat = (x: number, width: number, gap: number) => {
    const a = Math.max(1 / (timeSinceLastBeat + 1.0), 0);
    const bh = a * h;
    ctx.fillStyle = colorAt(a, beatColors);
    ctx.fillRect(x + gap, h - bh, width - gap - gap, bh);
  };

  const draw = () => {
    const gap = 0.5;
    const bw = w / (maxBins + levelStatKeys.length + 1);
    const spectrumWidth = bw * maxBins;
    const levelsWidth = bw * levelStatKeys.length;
    ctx.clearRect(0, 0, w, h);
    drawSpectrum(0, spectrumWidth, gap);
    drawLevels(spectrumWidth, levelsWidth, gap);
    drawBeat(spectrumWidth + levelsWidth, bw, gap);
  };

  function dbToNorm(db: number, minDb: number = -100, maxDb: number = 0) {
    return (db - minDb) / (maxDb - minDb);
  }

  function sumBins(source: Float32Array, target: Float32Array, d: number) {
    let items = [];
    let scale = 1 / d;
    for (let i = 0, j = 0, k = 0; i < source.length; i++, k = i % d, j += !!k ? 0 : 1) {
      items.push([i, j, k]);
      target[j] += dbToNorm(source[i]) * scale;
    }
  }

  function enable() {
    analyzer.events.unsubscribe("update", onUpdate);
    analyzer.events.subscribe("update", onUpdate);
    canvas.style.display = "block";
  }

  function disable() {
    analyzer.events.unsubscribe("update", onUpdate);
    canvas.style.display = "none";
  }

  const onUpdate: Handler<AudioAnalysisEvents, "update"> = ({ stats }) => {
    const fft = stats.fft.fftData;
    levelStats = stats.levels;
    timeSinceLastBeat = stats.beat.timeSinceLastBeat;

    let d = Math.floor(fft.length / Math.min(fft.length, maxBins));
    buffer.fill(0);
    sumBins(fft, buffer, d);

    requestAnimationFrame(draw);
  };

  return {
    element: canvas,
    enable,
    disable,
  };
}
