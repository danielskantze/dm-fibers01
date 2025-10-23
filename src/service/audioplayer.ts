export class AudioPlayerError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class AudioPlayer {
  private _audioContext: AudioContext;
  private _buffer?: AudioBuffer;
  private _source: AudioBufferSourceNode | null = null;
  private _startTime: DOMHighResTimeStamp = 0;
  private _playTime: DOMHighResTimeStamp = 0;
  private _position: DOMHighResTimeStamp = 0;
  private _isPlaying: boolean = false;
  private _playMonitor: number | null = null;

  constructor() { 
    this._audioContext = new AudioContext();
  }

  checkReady() {
    if (!this._audioContext) {
      throw new AudioPlayerError("No audio context available");
    }
    if (!this._buffer) {
      throw new AudioPlayerError("No audio data loaded");
    }
  }

  get ready(): boolean {
    return !!this._buffer;
  }

  async load(data: ArrayBuffer) {
    const shouldPlay = this._isPlaying;
    if (this._isPlaying) {
      this.stop(true);
    }
    this._playTime = 0;
    this._position = 0;
    this._buffer = await this._audioContext.decodeAudioData(data);
    if (shouldPlay) {
      this.play();
    }
  }

  private schedulePositionMonitor() {
    const fn = () => {
      this._position = this._playTime + performance.now() - this._startTime;
      if (this._isPlaying) {
        this._playMonitor = requestAnimationFrame(fn);
      }
    };
    this._playMonitor = requestAnimationFrame(fn);
  }

  play() {
    if (this._isPlaying) {
      return;
    }
    this._source = this._audioContext.createBufferSource();
    this._source.buffer = this._buffer!;
    this._source.connect(this._audioContext.destination);
    this._source.onended = () => {
      this._source?.disconnect();
      this._source = null;
    }
    const startPosition = this._playTime / 1000.0;
    this._source.start(0, startPosition);
    this._startTime = performance.now();
    this._isPlaying = true;
    this.schedulePositionMonitor();
  }

  stop(rewind: boolean = false) {
    this._isPlaying = false;
    if (this._playMonitor !== null) {
      cancelAnimationFrame(this._playMonitor);
    }
    if (this._source) {
      this._source.stop();
      this._source = null;
    }
    if (rewind) {
      this._playTime = 0;
      this._position = 0;
    } else {
      this._playTime = this._position;
    }
  }
}