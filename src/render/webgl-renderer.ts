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

type RenderingStagesState = {
  bloom: BloomStageParams,
}

export class WebGLRenderer {

  private _isRunning: boolean = false;
  private _frame: number = 0;
  private _renderWidth: number;
  private _renderHeight: number;
  
  private readonly _canvas: HTMLCanvasElement;
  private readonly _gl: WebGL2RenderingContext;
  private readonly _params: ParameterRegistry;
  private readonly _stages: RenderingStages;
  private readonly _renderConfig: RenderingConfig;

  constructor(settings: Settings, canvas: HTMLCanvasElement, params: ParameterRegistry) {
    this._canvas = canvas;
    this._params = params;
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
    this._isRunning = true;
    this._draw();
  }
  
  public pause(): void {
    if (!this._isRunning) return;
    this._isRunning = false;
  }

  public reset(): void {
    this._frame = 0;
    stage_accumulate.reset(this._gl, this._stages.accumulate);
    stage_blur.reset(this._gl, this._stages.blur);
    stage_combine.reset(this._gl, this._stages.combine);
    stage_luma.reset(this._gl, this._stages.luma);
    stage_materialize.reset(this._gl, this._stages.materialize);
    stage_simulate.reset(this._gl, this._stages.simulate);
    stage_output.reset(this._gl, this._stages.display);
  }
  
  public screenshot(): string {
    this._render(true);
    
    const imageData = screenshot.getTexturePng(
      this._gl, 
      this._stages.screenshot.resources.output as StageOutput
    );

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
    const bloomSteps = this._params.getValue<number>("bloom", "steps");
    const bloomQuality = this._params.getValue<number>("bloom", "quality");
  
    if (bloomSteps !== this._renderConfig.bloomSteps) {
        this._renderConfig.bloomSteps = bloomSteps;
        this._configureStages();
    }
    if (bloomQuality !== this._renderConfig.bloomQuality) {
        this._renderConfig.bloomQuality = bloomQuality;
        this._configureStages();
    }
    this._renderConfig.updatesPerDraw = this._params.getValue<number>("main", "updatesPerDraw");
    const numParticles = this._params.getValue<number>("main", "particles");
    const bloomState: BloomStageParams = {
      lumaThreshold: this._params.getValue<number>("bloom", "luma"),
      bloomIntensity: this._params.getValue<number>("bloom", "intensity"),
    }
      
    for (let i = 0; i < this._renderConfig.updatesPerDraw; i++) {
      this._updateSimulationStages(numParticles);
      this._frame++;
    }
    this._drawOutputStages({ bloom: bloomState }, isScreenshot);
  }
  
  private _updateSimulationStages(numParticles: number): void {
    const { maxNumParticles } = this._renderConfig;
    let frame = this._frame;
    const drawSize = textureSizeFromNumParticles(numParticles, maxNumParticles);
    stage_simulate.draw(this._gl, this._stages.simulate, frame, drawSize);
    stage_materialize.draw(this._gl, this._stages.materialize, frame, numParticles);
    stage_accumulate.draw(this._gl, this._stages.accumulate, frame);
  }
  
  private _drawOutputStages(state: RenderingStagesState, isScreenshot: boolean = false): void {
    const { bloom } = state;
    const blurQuality = stage_blur.lookupBlurQuality(this._renderConfig.bloomQuality);
    if (blurQuality !== "off") {
      stage_luma.draw(this._gl, this._stages.luma, bloom.lumaThreshold);
      stage_blur.draw(this._gl, this._stages.blur, undefined, this._renderConfig.bloomSteps, blurQuality);
      stage_combine.draw(this._gl, this._stages.combine, this._stages.blur, 1.0, bloom.bloomIntensity);
    }
    if (isScreenshot) {
      stage_output.draw(this._gl, this._stages.screenshot);
    } else {
      stage_output.draw(this._gl, this._stages.display, this._renderWidth, this._renderHeight);
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
    const materialize = stage_materialize.create(this._gl, simulate, this._renderWidth, this._renderHeight, this._renderConfig.maxNumParticles);
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