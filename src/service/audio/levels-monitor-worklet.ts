const webAudioBlockSize = 128;
const windowSizeSeconds = 0.5;
const numMetrics = 2; // peak & rms
const fps = 60.0;

class LevelsProcessor extends AudioWorkletProcessor {
  private _index = 0;
  private _sampleRate = 0;
  private _buffer: Float32Array | null = null; // store values interleaved
  private _bufferSize: number = 0;
  private _rmsSum = 0;
  private _peakSum = 0;
  private _frameCount = 0;
  private _messageInterval = 0;

  constructor() {
    super();
  }

  init() {
    // @ts-ignore
    this._sampleRate = sampleRate;
    const framesPerSecond = this._sampleRate / webAudioBlockSize;
    this._bufferSize = Math.floor(framesPerSecond * windowSizeSeconds);
    this._buffer = new Float32Array(this._bufferSize * numMetrics);
    this._buffer.fill(0);
    this._index = 0;
    this._messageInterval = Math.floor(framesPerSecond / (fps * 2)); // We send twice the fps just in case
  }

  updateBuffer(peak: number, rms: number) {
    const oldestPeak = this._buffer![this._index * 2];
    const oldestRms = this._buffer![this._index * 2 + 1];
    this._peakSum -= oldestPeak;
    this._rmsSum -= oldestRms;
    this._buffer![this._index * 2] = peak;
    this._buffer![this._index * 2 + 1] = rms;
    this._peakSum += peak;
    this._rmsSum += rms;
    this._index = (this._index + 1) % this._bufferSize;
  }

  process(
    inputs: Float32Array[][],
    _outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>
  ) {
    const input = inputs[0];
    // @ts-ignore
    if (!this._buffer) {
      this.init();
    }
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
      this.updateBuffer(peak, rms);
      const avgRms = this._rmsSum / this._bufferSize;
      const avgPeak = this._peakSum / this._bufferSize;
      this._frameCount++;
      if (this._frameCount >= this._messageInterval) {
        this._frameCount = 0;
        this.port.postMessage({ rms, peak, avgPeak, avgRms });
      }
    }
    return true;
  }
}

registerProcessor("levels-monitor", LevelsProcessor);
