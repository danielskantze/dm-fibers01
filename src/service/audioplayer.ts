import { Emitter, type Subscribable } from "../util/events";
import levelsProcessorUrl from "./audio/levels-processor?url";
import beatDetectorUrl from "./audio/beat-detector?url";

export class AudioPlayerError extends Error {
  constructor(message: string) {
    super(message);
  }
}

type AnalyzerSettings = {
  fftBins: "256" | "512" | "1024" | "2048" | "4096" | "8192";
  enabled?: boolean
};

type AudioStats = {
  rms: number,
  peak: number,
  beatTime: number,
  lastBeatTime: number,
  lastBeatTimestamp: number
};

const emptyStats: AudioStats = {
  rms: 0,
  peak: 0,
  beatTime: 0,
  lastBeatTime: 0,
  lastBeatTimestamp: 0,
}

type AudioAnalysis = {
  stats: AudioStats,
  fft: Float32Array<ArrayBuffer>
}

export type AudioEvents = {
  status: "loading" | "loaded" | "playing" | "paused" | "stopped" | "cleared";
  analysis: AudioAnalysis
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
  private _isAnalyzing: boolean = false;

  private _analyzer: AnalyserNode | null = null;
  private _analysisNodes: AudioNode[] = [];
  private _fftData: Float32Array<ArrayBuffer> | null = null;
  private _statsData: AudioStats = {...emptyStats};

  private _emitter = new Emitter<AudioEvents>();

  constructor() { 
    this._audioContext = new AudioContext();
  }

  async initialize(analyzerSettings?: AnalyzerSettings) {
    if (analyzerSettings) {
      await this._audioContext.audioWorklet.addModule(levelsProcessorUrl);
      const levelsNode = new AudioWorkletNode(
        this._audioContext,
        "levels-processor",
      );
      levelsNode.port.onmessage = (e) => {
        this._statsData = {...this._statsData, ...e.data};
        this._statsData.beatTime = Math.max(0, (performance.now() - this._statsData.lastBeatTimestamp) / 1000.0);
      }
      this._analysisNodes.push(levelsNode);

      const lowpassFilter = this._audioContext.createBiquadFilter();
      lowpassFilter.type = 'lowpass';
      lowpassFilter.frequency.setValueAtTime(150, this._audioContext.currentTime);
      await this._audioContext.audioWorklet.addModule(beatDetectorUrl);
      const beatDetectorNode = new AudioWorkletNode(
        this._audioContext, 
        'beat-detector'
      );
      lowpassFilter.connect(beatDetectorNode);
      beatDetectorNode.port.onmessage = (e) => {
        this._statsData.lastBeatTimestamp = performance.now();
        this._statsData.lastBeatTime = e.data.time;
      }
      this._analysisNodes.push(lowpassFilter);
      
      this._analyzer = this._audioContext.createAnalyser();
      this._analyzer.fftSize = parseInt(analyzerSettings.fftBins);
      this._fftData = new Float32Array(this._analyzer.frequencyBinCount);
      this._isAnalyzing = analyzerSettings.enabled ?? true;
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
    return !!this._analyzer && this._isAnalyzing;
  }

  set isAnalyzing(value: boolean) {
    this._isAnalyzing = value;
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
      if (this.isAnalyzing) {
        this._analyzer!.getFloatFrequencyData(this._fftData!);
        this._emitter.emit("analysis", {
          stats: this._statsData,
          fft: this._fftData!
        });
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
    if (this._analyzer) {
      this._source.connect(this._analyzer);
    }
    this._analysisNodes.forEach((n) => (this._source!.connect(n)));
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