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

export type RenderingStages = {
    simulate: Stage,
    materialize: Stage,
    accumulate: Stage,
    luma: Stage,
    blur: Stage,
    combine: Stage,
    display: Stage,
    screenshot: Stage
  };
  

function textureSizeFromNumParticles(numParticles: number, maxNumParticles: number): [number, number] {
  let pts = numParticles;
  if (pts > maxNumParticles) {
    pts = maxNumParticles;
  }
  const w = Math.floor(Math.sqrt(pts));
  return [w, w];
}

export type CreateRenderingStagesProps = {
  gl: WebGL2RenderingContext,
  maxNumParticles: number,
  maxBloomSteps: number,
  renderWidth: number,
  renderHeight: number,
  params: ParameterRegistry,
  settings: Settings,
}

export function createRenderingStages({ gl, maxNumParticles, maxBloomSteps, renderWidth, renderHeight, params, settings }: CreateRenderingStagesProps): RenderingStages {
  const simulate = stage_simulate.create(gl, maxNumParticles);
  const materialize = stage_materialize.create(gl, simulate, renderWidth, renderHeight, maxNumParticles, settings.msaa);
  const accumulate = stage_accumulate.create(gl, materialize);
  const luma = stage_luma.create(gl, accumulate);
  const blur = stage_blur.create(gl, luma, "low", maxBloomSteps);
  const combine = stage_combine.create(gl, accumulate);
  const display = stage_output.create(gl, combine, false);
  const screenshot = stage_output.create(gl, combine, true);
  
  Object.keys(simulate.parameters).forEach((k) => (
    params.register(simulate.name, k, simulate.parameters[k]))
  );

  Object.keys(accumulate.parameters).forEach((k) => (
    params.register(accumulate.name, k, accumulate.parameters[k]))
  );

  return {
    simulate, materialize, accumulate, luma, blur, combine, display, screenshot
  }
}

export function configureRenderingStages(config: RenderingConfig, stages: RenderingStages) {
  if (config.bloomQuality > 0) {
    stages.display.input = stages.combine;
    stages.screenshot.input = stages.combine;
  } else {
    stages.display.input = stages.accumulate;
    stages.screenshot.input = stages.accumulate;
  }
}

type BloomStageParams = {
  lumaThreshold: number,
  bloomIntensity: number,
}

export type RenderingState = {
  time: number,
  frame: number,
  width: number,
  height: number,
  numParticles: number,
  stages: {
    bloom: BloomStageParams
  }
}

export function updateSimulationStages(gl: WebGL2RenderingContext, config: RenderingConfig, stages: RenderingStages, state: RenderingState) {
  const { maxNumParticles } = config;
  const { time, frame, numParticles } = state;
  const drawSize = textureSizeFromNumParticles(numParticles, maxNumParticles);
  stage_simulate.draw(gl, stages.simulate, time, frame, drawSize);
  stage_materialize.draw(gl, stages.materialize, time, frame, numParticles);
  stage_accumulate.draw(gl, stages.accumulate, time, frame);
}


export function drawOutputStages(gl: WebGL2RenderingContext, config: RenderingConfig, stages: RenderingStages, state: RenderingState, screenshot: boolean = false) {
  const { width, height, stages: { bloom } } = state;
  const blurQuality = stage_blur.lookupBlurQuality(config.bloomQuality);
  if (blurQuality !== "off") {
    stage_luma.draw(gl, stages.luma, bloom.lumaThreshold);
    stage_blur.draw(gl, stages.blur, undefined, config.bloomSteps, blurQuality);
    stage_combine.draw(gl, stages.combine, stages.blur, 1.0, bloom.bloomIntensity);
  }
  if (screenshot) {
    stage_output.draw(gl, stages.screenshot);
  } else {
    stage_output.draw(gl, stages.display, width, height);
  }
}

export type RenderProps = {
  gl: WebGL2RenderingContext,
  config: RenderingConfig,
  stages: RenderingStages,
  params: ParameterRegistry,
}

export function createRenderingState(params: ParameterRegistry, elapsedTime: number, startTime: number, frame: number, width: number, height: number): RenderingState {
  return {
      time: elapsedTime + (performance.now() - startTime) / 1000,
      frame,
      numParticles: params.getNumberValue("main", "particles"),
      stages: {
        bloom: {
          lumaThreshold: params.getNumberValue("bloom", "luma"),
          bloomIntensity: params.getNumberValue("bloom", "intensity"),
        }
      },
      width,
      height
    };    
}

export function render({ gl, config, stages, params }: RenderProps, state: RenderingState, screenshot?: boolean): number {
  const bloomSteps = params.getNumberValue("bloom", "steps");
  const bloomQuality = params.getNumberValue("bloom", "quality");
  let renderingState = {...state };
  if (bloomSteps !== config.bloomSteps) {
      config.bloomSteps = bloomSteps;
    configureRenderingStages(config, stages);
  }
  if (bloomQuality !== config.bloomQuality) {
      config.bloomQuality = bloomQuality;
    configureRenderingStages(config, stages);
  }
  config.updatesPerDraw = params.getNumberValue("main", "updatesPerDraw");

  for (let i = 0; i < config.updatesPerDraw; i++) {
    updateSimulationStages(gl, config, stages, renderingState);
    renderingState.frame++;
  }
  drawOutputStages(gl, config, stages, renderingState, screenshot);
  return renderingState.frame;
}

export class WebGLRenderer {

  private _isRunning: boolean = false;
  private _elapsedTime: number = 0;
  private _startTime: number = 0;
  private _frame: number = 0;
  private _renderWidth: number; // use renderSize / Vec2 instead
  private _renderHeight: number; // use renderSize / Vec2 instead
  private _canvas: HTMLCanvasElement;
  private _gl: WebGL2RenderingContext;
  private _params: ParameterRegistry;

  // TODO: Remove
  private _settings: Settings;
  private _stages: RenderingStages;
  private _renderConfig: RenderingConfig;

  constructor(settings: Settings, canvas: HTMLCanvasElement, params: ParameterRegistry) {
    this._startTime = performance.now();
    this._canvas = canvas;
    this._params = params;
    this._renderWidth = settings.width * settings.dpr;
    this._renderHeight = settings.height * settings.dpr;
    this._settings = settings;
    this._renderConfig = defaultRenderConfig;
    this._gl = this._createGl(canvas);
    this._stages = this._createStages();
    this._configure();
  }

  public get isRunning(): boolean {
    return this._isRunning;
  }

  private _createGl(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2")!;
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
    const renderingStagesProps: CreateRenderingStagesProps = {
      gl: this._gl,
      maxNumParticles: this._renderConfig.maxNumParticles,
      maxBloomSteps: this._renderConfig.maxBloomSteps,
      renderWidth: this._renderWidth,
      renderHeight: this._renderHeight,
      params: this._params,
      settings: this._settings
    }
    const stages = createRenderingStages(renderingStagesProps);    
    return stages;
  }

  private _configure() {
    configureRenderingStages(this._renderConfig, this._stages);
  }

  private _draw(renderProps: RenderProps) {
    if (!this.isRunning) {
      return;
    }
    const renderingState = createRenderingState(
      this._params, 
      this._elapsedTime, 
      this._startTime, 
      this._frame, 
      this._renderWidth, 
      this._renderHeight
    );
    this._frame = render(renderProps, renderingState);
    requestAnimationFrame(() => {
      this._draw(renderProps);
    });
  }

  screenshot(): any {
    if (!this._isRunning) {
      this._startTime = performance.now();
    }
    const renderProps: RenderProps = {
      gl: this._gl,
      config: this._renderConfig,
      stages: this._stages,
      params: this._params,
    }
    const renderingState = createRenderingState(
      this._params, 
      this._elapsedTime, 
      this._startTime, 
      this._frame, 
      this._renderWidth, 
      this._renderHeight
    );
    this._frame = render(renderProps, renderingState, true);
    const imageData = screenshot.getTexturePng(
      this._gl, 
      this._stages.screenshot.resources.output as StageOutput);
    if (!this._isRunning) {
      this._elapsedTime += (performance.now() - this._startTime) / 1000;
    }
    return imageData;
  }

  pause() {
    this._isRunning = false;
    this._elapsedTime += (performance.now() - this._startTime) / 1000;
  }

  start() {
    const renderProps: RenderProps = {
      gl: this._gl,
      config: this._renderConfig,
      stages: this._stages,
      params: this._params,
    }
    this._startTime = performance.now();
    this._isRunning = true;
    this._draw(renderProps);
  }
}