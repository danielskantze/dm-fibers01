class LevelsProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(
    inputs: Float32Array<ArrayBufferLike>[][], 
    _outputs: Float32Array<ArrayBufferLike>[][], 
    _parameters: Record<string, Float32Array<ArrayBufferLike>>) {
    const input = inputs[0];
    if (input && input[0]) {
      const channelData = input[0];
      let sumSquares = 0;
      let peak = 0;

      for (let i = 0; i < channelData.length; i++) {
        const sample = channelData[i];
        sumSquares += sample * sample;
        if (Math.abs(sample) > peak) peak = Math.abs(sample);
      }
      const rms = Math.sqrt(sumSquares / channelData.length);
      this.port.postMessage({ rms, peak });
    }
    return true;
  }
}

registerProcessor('levels-processor', LevelsProcessor);
