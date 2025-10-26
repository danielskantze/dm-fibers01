export type AudioStatsDetectorState = Record<string, number | Float32Array>;

export type AudioStatsDetector = {
  update: (position: number) => void;
  reset: () => void;
  readonly node: AudioNode;
  readonly state: AudioStatsDetectorState;
};
