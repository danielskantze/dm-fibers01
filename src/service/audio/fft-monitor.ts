import type { AudioStatsDetector } from "./types";


export type FFTMonitorState = {
    fftData: Float32Array<ArrayBuffer>,
};

type FFTAnalyserSettings = {
    bins: 128 | 256 | 512 | 1024 | 2048
}

export async function create(context: AudioContext, settings: FFTAnalyserSettings): Promise<AudioStatsDetector> {
    const node = context.createAnalyser();
    node.fftSize = settings.bins;
    const state: FFTMonitorState = {
        fftData: new Float32Array(node.frequencyBinCount)
    };
    
    function update() {
        node.getFloatFrequencyData(state.fftData);
    }

    function reset() {
        state.fftData.fill(0.0);
    }

    return {
        update,
        reset,
        node,
        state
    }
}