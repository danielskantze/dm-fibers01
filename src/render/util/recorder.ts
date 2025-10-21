import { Output, Mp4OutputFormat, BufferTarget, CanvasSource, QUALITY_HIGH } from 'mediabunny';


export interface IVideoRecorder {
  start: () => Promise<void>;
  stop: () => Promise<ArrayBuffer | null>;
  addFrame: (frame: number) => void;
};

export class VideoRecorder implements IVideoRecorder {
  private _output: Output;
  private _source: CanvasSource;

  constructor(canvas: HTMLCanvasElement) {
    this._output = new Output({
      format: new Mp4OutputFormat(),
      target: new BufferTarget(),
    });
    this._source = new CanvasSource(canvas, {
      codec: 'avc',
      bitrate: QUALITY_HIGH,
    });
    this._output.addVideoTrack(this._source);
  }
  async start() {
    await this._output.start();
  }
  async stop() {
    await this._output.finalize();
    return (this._output.target as BufferTarget).buffer;
  }
  async addFrame(frame: number) {
    // TODO: Implement
  }
}