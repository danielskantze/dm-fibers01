import workletUrl from "./levels-monitor-worklet?url";
import type { AudioStatsDetector } from "./types";
const workletId = "levels-monitor";

export type LevelsMonitorState = {
  rms: number;
  peak: number;
  avgPeak: number;
  avgRms: number;
};

export async function create(context: AudioContext): Promise<AudioStatsDetector> {
  const state: LevelsMonitorState = {
    rms: 0,
    peak: 0,
    avgPeak: 0,
    avgRms: 0,
  };
  await context.audioWorklet.addModule(workletUrl);

  const node = new AudioWorkletNode(context, workletId);
  node.port.onmessage = e => {
    state.rms = e.data.rms;
    state.peak = e.data.peak;
    state.avgRms = e.data.avgRms;
    state.avgPeak = e.data.avgPeak;
  };

  function update() {}

  function reset() {
    state.rms = 0;
    state.peak = 0;
    state.avgPeak = 0;
    state.avgRms = 0;
  }

  return {
    update,
    reset,
    node,
    state,
  };
}
