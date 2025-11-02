import { create as createStaircase } from "../../math/transfer/staircase";
import workletUrl from "./levels-monitor-worklet?url";
import type { AudioStatsDetector } from "./types";
const workletId = "levels-monitor";

export type LevelsMonitorState = {
  rms: number;
  peak: number;
  avgPeak: number;
  avgRms: number;
  avgRms3: number;
  avgRms5: number;
};

function ease(x: number) {
  const ix = 1 - x;
  return 1 - ix * ix;
}

export async function create(context: AudioContext): Promise<AudioStatsDetector> {
  const staircase3 = createStaircase(3, 6);
  const staircase5 = createStaircase(5, 6);
  const state: LevelsMonitorState = {
    rms: 0,
    peak: 0,
    avgPeak: 0,
    avgRms: 0,
    avgRms3: 0,
    avgRms5: 0,
  };
  await context.audioWorklet.addModule(workletUrl);

  const node = new AudioWorkletNode(context, workletId);
  node.port.onmessage = e => {
    state.rms = e.data.rms;
    state.peak = e.data.peak;
    state.avgRms = e.data.avgRms;
    state.avgPeak = e.data.avgPeak;
    const compressed = ease(Math.min(1.0, state.avgRms * 1.5));
    state.avgRms3 = staircase3(compressed);
    state.avgRms5 = staircase5(compressed);
  };

  function update() {}

  function reset() {
    state.rms = 0;
    state.peak = 0;
    state.avgPeak = 0;
    state.avgRms = 0;
    state.avgRms3 = 0;
    state.avgRms5 = 0;
  }

  return {
    update,
    reset,
    node,
    state,
  };
}
