class StatsProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.counter = 0;
  }

  process(inputs, outputs, parameters) {
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

      // Send stats to main thread
      this.port.postMessage({ rms, peak });
    }

    // Continue processing
    return true;
  }
}

registerProcessor('stats-processor', StatsProcessor);
