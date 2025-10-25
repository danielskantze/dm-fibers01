import { Emitter, type Subscribable } from "../util/events";
import type { InternalAudioStatsCollector, PublicAudioStatsCollector } from "./audio/audio-stats";

export class AudioPlayerError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export type AudioEvents = {
  status: "loading" | "loaded" | "playing" | "paused" | "stopped" | "cleared";
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

  private _emitter = new Emitter<AudioEvents>();
  private _statsCollector: InternalAudioStatsCollector | null;

  constructor(statsCollector: PublicAudioStatsCollector | null) { 
    this._audioContext = new AudioContext();
    this._statsCollector = statsCollector as InternalAudioStatsCollector;
  }

  async initialize() {
    if (this._statsCollector) {
      await this._statsCollector.initialize(this._audioContext);
    }
  }

  checkReady() {
    if (!this._audioContext) {
      throw new AudioPlayerError("No audio context available");
    }
    if (!this._buffer) {
      throw new AudioPlayerError("No audio data loaded");
    }
  }

  get events(): Subscribable<AudioEvents> {
    return this._emitter;
  }

  get isAnalyzing() {
    return !!this._statsCollector;
  }

  get ready(): boolean {
    return !!this._buffer;
  }

  clear() {
    this.stop(true);
    this._buffer = undefined;
    this._emitter.emit("status", "cleared");
  }

  async load(data: ArrayBuffer) {
    const shouldPlay = this._isPlaying;
    this._emitter.emit("status", "loading");
    if (this._isPlaying) {
      this.stop(true);
    }
    this._playTime = 0;
    this._position = 0;
    this._buffer = await this._audioContext.decodeAudioData(data);
    this._emitter.emit("status", "loaded");
    if (shouldPlay) {
      this.play();
    }
  }

  private startPlayMonitor() {
    const fn = () => {
      this._position = this._playTime + performance.now() - this._startTime;
      if (this._statsCollector) {
        this._statsCollector.update(this._position);
      }
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
    if (this._statsCollector) {
      this._statsCollector.connectSource(this._source);
    }
    this._source.onended = () => {
      this._source?.disconnect();
      this._source = null;
    }
    const startPosition = this._playTime / 1000.0;
    this._source.start(0, startPosition);
    this._startTime = performance.now();
    this._isPlaying = true;
    this.startPlayMonitor();
    this._emitter.emit("status", "playing");
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
      this._emitter.emit("status", "stopped");
    } else {
      this._playTime = this._position;
      this._emitter.emit("status", "paused");
    }
  }
}