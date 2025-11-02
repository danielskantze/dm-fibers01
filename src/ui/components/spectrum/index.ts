import type {
  AudioAnalysisEvents,
  AudioAnalysisType,
  AudioStats,
  PublicAudioStatsCollector,
} from "../../../service/audio/audio-stats";
import type { Handler } from "../../../util/events";
import { StreamLogging } from "../../../util/logging";

export function createSpectrum(
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

  let buffer = new Float32Array(maxBins);

  ctx.fillStyle = "white";

  const draw = () => {
    const bw = w / maxBins;
    const gap = 0.5;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    for (let i = 0; i < maxBins; i++) {
      const x = i * bw;
      let bh = 1.0 - buffer[i];
      bh = (1.0 - bh * bh * bh) * h;
      const p = i / maxBins;
      ctx.fillStyle = `rgb(${Math.floor((1.0 - p) * 255)}, ${Math.floor(p * 255)}, 0)`;
      ctx.fillRect(x + gap, h - bh, bw - gap - gap, bh);
    }
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
