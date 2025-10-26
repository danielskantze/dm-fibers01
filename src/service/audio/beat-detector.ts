import workletUrl from "./beat-detector-worklet?url";
import type { AudioStatsDetector } from "./types";

const workletId = "beat-detector";

export type BeatDetectorState = {
  lastBeatTime: number;
  timeSinceLastBeat: number;
};

export async function create(context: AudioContext): Promise<AudioStatsDetector> {
  const state: BeatDetectorState = {
    lastBeatTime: 0,
    timeSinceLastBeat: 0,
  };
  let lastUpdate: number = performance.now();

  await context.audioWorklet.addModule(workletUrl);

  const node = new AudioWorkletNode(context, workletId);
  node.port.onmessage = e => {
    state.lastBeatTime = e.data.time;
    state.timeSinceLastBeat = 0;
    lastUpdate = performance.now();
  };

  const lowpassFilter = context.createBiquadFilter();
  lowpassFilter.type = "lowpass";
  lowpassFilter.frequency.setValueAtTime(150, context.currentTime);
  lowpassFilter.connect(node);

  function update() {
    state.timeSinceLastBeat = Math.max(0, (performance.now() - lastUpdate) / 1000.0);
  }

  function reset() {
    lastUpdate = performance.now();
    state.lastBeatTime = 0;
    state.timeSinceLastBeat = 0;
  }

  return {
    update,
    reset,
    node: lowpassFilter,
    state,
  };
}
