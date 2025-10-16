import type { Stage } from "../types/stage";
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