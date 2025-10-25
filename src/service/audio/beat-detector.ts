// beat-detector.js

class BeatDetector extends AudioWorkletProcessor {
  private _history: Float32Array | null = null;
  private _historyIndex: number = 0;
  
  private _lastBeatTime: number = -1.0;
  private _historySize: number = 0;
  
  public historySeconds: number = 1.5;
  public sensitivity: number = 1.4;
  public debounceTimeMs: number = 300.0;
  public debounceTimeSec: number = 300.0 / 1000.0;

  constructor() {
    super();
  }

  /**
   * Lazily initialize the history buffer once we know the sampleRate.
   */
  initHistoryBuffer() {
    // 128 samples is the default frame size
    // @ts-ignore
    const framesPerSecond = sampleRate / 128.0; 
    this._historySize = Math.floor(framesPerSecond * this.historySeconds);
    this._history = new Float32Array(this._historySize).fill(0.0);
  }

  process(inputs: Float32Array<ArrayBufferLike>[][], 
    _outputs: Float32Array<ArrayBufferLike>[][], 
    _parameters: Record<string, Float32Array<ArrayBufferLike>>) {
    const inputChannel = inputs[0][0]; // Assuming mono input after filter

    // Guard against disconnected input
    if (!inputChannel) {
      return true;
    }

    // Initialize buffer on first run
    if (!this._history) {
      this.initHistoryBuffer();
    }

    // 1. Find the peak amplitude in this frame
    let framePeak = 0.0;
    for (let i = 0; i < inputChannel.length; i++) {
      const p = Math.abs(inputChannel[i]);
      if (p > framePeak) {
        framePeak = p;
      }
    }

    // 2. Calculate the adaptive threshold
    let historySum = 0.0;
    for (const v of this._history!) {
      historySum += v;
    }
    const average = historySum / this._historySize;
    const threshold = average * this.sensitivity;

    // 3. Check for beat (peak > threshold + debounce)
    // @ts-ignore: Unreachable code error
    const now = currentTime; // `currentTime` is in seconds
    if (framePeak > threshold && (now - this._lastBeatTime > this.debounceTimeSec)) {
      
      // Send a beat event back to the main thread
      this.port.postMessage({
        type: 'beat',
        time: now,
      });
      
      this._lastBeatTime = now;
    }

    // 4. Update history
    this._history![this._historyIndex] = framePeak;
    this._historyIndex = (this._historyIndex + 1) % this._historySize;

    return true;
  }
}

registerProcessor('beat-detector', BeatDetector);