import { Output, Mp4OutputFormat, BufferTarget, CanvasSource, QUALITY_HIGH } from 'mediabunny';
import { Emitter, type Subscribable } from "../../util/events";

export interface IVideoRecorder {
  start: () => Promise<void>;
  stop: () => Promise<ArrayBuffer | null>;
  captureFrame: () => Promise<void>;
  events: Subscribable<RecorderEvent>;
};

export type RecorderStatus = "created" | "starting" | "ready" | "finalizing" | "completed";

export type RecorderEvent = {
  status: RecorderStatus
}

const isWindows = window.navigator.platform === "Win32";

type VideoRecorderOptions = {
  title: string;
  fps?: number;
}
export class VideoRecorder implements IVideoRecorder {
  private _output: Output;
  private _source: CanvasSource;
  private _framesAdded: number = 0;
  private _fps: number;
  private _status: RecorderStatus = "created";
  private _emitter: Emitter<RecorderEvent> = new Emitter<RecorderEvent>();

  constructor(canvas: HTMLCanvasElement, {fps = 60, title} : VideoRecorderOptions) {
    this._fps = fps;
    this._output = new Output({
      format: new Mp4OutputFormat(),
      target: new BufferTarget(),
    });
    this._source = new CanvasSource(canvas, {
      codec: isWindows ? 'vp9' : 'avc',
      bitrate: QUALITY_HIGH,
    });
    this._output.addVideoTrack(this._source, {
      frameRate: this._fps
    });
    this._output.setMetadataTags({
      title,
      date: new Date()
    })
  }
  get status() {
    return this._status;
  }
  get events() {
    return this._emitter;
  }
  _setStatus(newStatus: RecorderStatus) {
    this._status = newStatus;
    this._emitter.emit("status", this._status);
  }
  async start() {
    this._setStatus("starting");
    await this._output.start();
    this._setStatus("ready");
  }
  async stop() {
    this._setStatus("finalizing");
    await this._output.finalize();
    this._setStatus("completed");
    return (this._output.target as BufferTarget).buffer;
  }
  async captureFrame() {
    const timestamp = this._framesAdded / this._fps;
	  const duration = 1 / this._fps;
    this._source.add(timestamp, duration);
    this._framesAdded += 1;
  }
}