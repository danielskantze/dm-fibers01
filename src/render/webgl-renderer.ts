import type { Stage, StageOutput } from "../types/stage";
import * as stage_accumulate from "./stages/accumulate";
import * as stage_blur from "./stages/blur";
import * as stage_combine from "./stages/combine";
import * as stage_luma from "./stages/luma";
import * as stage_materialize from "./stages/materialize";
import * as stage_output from "./stages/output";
import * as stage_simulate from "./stages/simulate";
import type { RenderingConfig } from "../types/config";
import type { ParameterRegistry } from "../service/parameters";
import type { Settings } from "../types/settings";
import { WebGLTextureError } from "../types/error";
import { defaultRenderConfig } from "../config/parameters";
import * as screenshot from "./util/screenshot";

// This is a pure utility function and can remain outside the class.
function textureSizeFromNumParticles(numParticles: number, maxNumParticles: number): [number, number] {
  let pts = numParticles;
  if (pts > maxNumParticles) {
    pts = maxNumParticles;
  }
  const w = Math.floor(Math.sqrt(pts));
  return [w, w];
}

// These types are internal to the renderer's logic.
type RenderingStages = {
  simulate: Stage,
  materialize: Stage,
  accumulate: Stage,
  luma: Stage,
  blur: Stage,
  combine: Stage,
  display: Stage,
  screenshot: Stage
};

type BloomStageParams = {
  lumaThreshold: number,
  bloomIntensity: number,
}

type RenderingState = {
  time: number,
  frame: number,
  width: number,
  height: number,
  numParticles: number,
  stages: {
    bloom: BloomStageParams
  }
}

export class WebGLRenderer {

  private _isRunning: boolean = false;
  private _elapsedTime: number = 0;
  private _startTime: number = 0;
  private _frame: number = 0;
  private _renderWidth: number;
  private _renderHeight: number;
  
  private readonly _canvas: HTMLCanvasElement;
  private readonly _gl: WebGL2RenderingContext;
  private readonly _params: ParameterRegistry;
  private readonly _settings: Settings;
  private readonly _stages: RenderingStages;
  private readonly _renderConfig: RenderingConfig;

  constructor(settings: Settings, canvas: HTMLCanvasElement, params: ParameterRegistry) {
    this._startTime = performance.now();
    this._canvas = canvas;
    this._params = params;
    this._settings = settings;
    this._renderWidth = settings.width * settings.dpr;
    this._renderHeight = settings.height * settings.dpr;
    this._renderConfig = defaultRenderConfig;

    this._gl = this._createGl();
    this._stages = this._createStages();
    this._configureStages();
  }

  public get isRunning(): boolean {
    return this._isRunning;
  }

  public start(): void {
    if (this._isRunning) return;
    this._startTime = performance.now();
    this._isRunning = true;
    this._draw();
  }
  
  public pause(): void {
    if (!this._isRunning) return;
    this._isRunning = false;
    this._elapsedTime += (performance.now() - this._startTime) / 1000;
  }
  
  public screenshot(): string {
    const wasRunning = this._isRunning;
    if (!wasRunning) {
      this._startTime = performance.now();
    }

    this._render(true);
    
    const imageData = screenshot.getTexturePng(
      this._gl, 
      this._stages.screenshot.resources.output as StageOutput
    );

    if (!wasRunning) {
      this._elapsedTime += (performance.now() - this._startTime) / 1000;
    }
    return imageData;
  }

  private _draw(): void {
    if (!this._isRunning) {
      return;
    }
    this._render(false);
    requestAnimationFrame(() => this._draw());
  }

  private _render(isScreenshot: boolean = false): void {
    const bloomSteps = this._params.getNumberValue("bloom", "steps");
    const bloomQuality = this._params.getNumberValue("bloom", "quality");
  
    if (bloomSteps !== this._renderConfig.bloomSteps) {
        this._renderConfig.bloomSteps = bloomSteps;
        this._configureStages();
    }
    if (bloomQuality !== this._renderConfig.bloomQuality) {
        this._renderConfig.bloomQuality = bloomQuality;
        this._configureStages();
    }
    this._renderConfig.updatesPerDraw = this._params.getNumberValue("main", "updatesPerDraw");
  
    const state = this._createRenderingState();
    
    let currentFrame = state.frame;
    for (let i = 0; i < this._renderConfig.updatesPerDraw; i++) {
      this._updateSimulationStages({ ...state, frame: currentFrame });
      currentFrame++;
    }
    this._drawOutputStages(state, isScreenshot);
    this._frame = currentFrame;
  }
  
  private _createRenderingState(): RenderingState {
    return {
        time: this._elapsedTime + (performance.now() - this._startTime) / 1000,
        frame: this._frame,
        numParticles: this._params.getNumberValue("main", "particles"),
        stages: {
          bloom: {
            lumaThreshold: this._params.getNumberValue("bloom", "luma"),
            bloomIntensity: this._params.getNumberValue("bloom", "intensity"),
          }
        },
        width: this._renderWidth,
        height: this._renderHeight
      };    
  }

  private _updateSimulationStages(state: RenderingState): void {
    const { maxNumParticles } = this._renderConfig;
    const { time, frame, numParticles } = state;
    const drawSize = textureSizeFromNumParticles(numParticles, maxNumParticles);
    stage_simulate.draw(this._gl, this._stages.simulate, time, frame, drawSize);
    stage_materialize.draw(this._gl, this._stages.materialize, time, frame, numParticles);
    stage_accumulate.draw(this._gl, this._stages.accumulate, time, frame);
  }
  
  private _drawOutputStages(state: RenderingState, isScreenshot: boolean = false): void {
    const { width, height, stages: { bloom } } = state;
    const blurQuality = stage_blur.lookupBlurQuality(this._renderConfig.bloomQuality);
    if (blurQuality !== "off") {
      stage_luma.draw(this._gl, this._stages.luma, bloom.lumaThreshold);
      stage_blur.draw(this._gl, this._stages.blur, undefined, this._renderConfig.bloomSteps, blurQuality);
      stage_combine.draw(this._gl, this._stages.combine, this._stages.blur, 1.0, bloom.bloomIntensity);
    }
    if (isScreenshot) {
      stage_output.draw(this._gl, this._stages.screenshot);
    } else {
      stage_output.draw(this._gl, this._stages.display, width, height);
    }
  }

  private _createGl(): WebGL2RenderingContext {
    const gl = this._canvas.getContext("webgl2")!;
    let ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
      throw new WebGLTextureError("This browser does not support rendering to float textures");
    }
    ext = gl.getExtension("EXT_color_buffer_half_float");
    if (!ext) {
      throw new WebGLTextureError("This browser does not support rendering to half float textures");
    }
    return gl;
  }

  private _createStages(): RenderingStages {
    const simulate = stage_simulate.create(this._gl, this._renderConfig.maxNumParticles);
    const materialize = stage_materialize.create(this._gl, simulate, this._renderWidth, this._renderHeight, this._renderConfig.maxNumParticles, this._settings.msaa);
    const accumulate = stage_accumulate.create(this._gl, materialize);
    const luma = stage_luma.create(this._gl, accumulate);
    const blur = stage_blur.create(this._gl, luma, "low", this._renderConfig.maxBloomSteps);
    const combine = stage_combine.create(this._gl, accumulate);
    const display = stage_output.create(this._gl, combine, false);
    const screenshot = stage_output.create(this._gl, combine, true);
    
    Object.keys(simulate.parameters).forEach((k) => (
      this._params.register(simulate.name, k, simulate.parameters[k]))
    );
  
    Object.keys(accumulate.parameters).forEach((k) => (
      this._params.register(accumulate.name, k, accumulate.parameters[k]))
    );
  
    return {
      simulate, materialize, accumulate, luma, blur, combine, display, screenshot
    }
  }

  private _configureStages(): void {
    if (this._renderConfig.bloomQuality > 0) {
      this._stages.display.input = this._stages.combine;
      this._stages.screenshot.input = this._stages.combine;
    } else {
      this._stages.display.input = this._stages.accumulate;
      this._stages.screenshot.input = this._stages.accumulate;
    }
  }
}