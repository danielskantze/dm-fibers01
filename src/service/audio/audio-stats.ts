import { Emitter, type Subscribable } from "../../util/events";
import { create as createBeatDetector, type BeatDetectorState } from "./beat-detector";
import { create as createFFTMonitor, type FFTMonitorState } from "./fft-monitor";
import { create as createLevelsMonitor, type LevelsMonitorState } from "./levels-monitor";
import type { AudioStatsDetector, AudioStatsDetectorState } from "./types";

export type AudioStats = {
    beat: BeatDetectorState,
    levels: LevelsMonitorState,
    fft: FFTMonitorState
}

export type AudioAnalysisType = keyof AudioStats;

export const availableAnalysisTypes: AudioAnalysisType[] = ["beat", "levels", "fft"];

type AudioStatsCollectorParams = {
    enabledTypes: AudioAnalysisType[]
}

type State = Record<AudioAnalysisType, AudioStatsDetectorState>;

function createEmptyState(): State {
    return {
        beat: {
            lastBeatTime: 0,
            timeSinceLastBeat: 0
        },
        levels: {
            rms: 0,
            peak: 0
        },
        fft: {
            fftData: new Float32Array()
        }
    }
}

type AudioAnalysisEvents = {
    update: {
        stats: AudioStats
    }
}

class AudioStatsCollector {
    private _detectors: [AudioAnalysisType, AudioStatsDetector][] = [];
    private _params: AudioStatsCollectorParams;
    private _stats: State = createEmptyState();

    private _emitter = new Emitter<AudioAnalysisEvents>();

    constructor(params: AudioStatsCollectorParams) {
        this._params = params;
    }

    get events(): Subscribable<AudioAnalysisEvents> {
        return this._emitter;
    }

    get stats(): AudioStats {
        return this._stats as AudioStats;
    }

    async initialize(context: AudioContext) {
        for (const t of availableAnalysisTypes) {
            if (this._params.enabledTypes.indexOf(t) >= 0) {
                let detector: AudioStatsDetector;
                switch (t) {
                    case "beat":
                        detector = await createBeatDetector(context);
                        break;
                    case "fft":
                        detector = await createFFTMonitor(context, { bins: 1024 });
                        break;
                    case "levels":
                        detector = await createLevelsMonitor(context);
                        break;
                }
                this._detectors.push([t, detector]);
            }
        }

    }

    connectSource(source: AudioBufferSourceNode) {
        this._detectors.forEach(([, { node }]) => (source.connect(node)));
    }

    update(position: number) {
        this._detectors.forEach(([t, { update, state }]) => {
            update(position);
            this._stats[t] = state as AudioStats[typeof t];
        });
        this._emitter.emit("update", {stats: this.stats });
    }
}

export type PublicAudioStatsCollector = Pick<AudioStatsCollector, "events">;

export type InternalAudioStatsCollector = AudioStatsCollector;

export function createAudioStatsCollector(params: AudioStatsCollectorParams): PublicAudioStatsCollector {
    return new AudioStatsCollector(params);
}