import type { ParameterGroup, ParameterGroupDescriptor } from "../parameters";
import type { RenderingConfig } from "../types/config";
import * as constants from "./constants";

export const defaultParameters = {
  groups: {
    descriptors: [

    ] as ParameterGroupDescriptor[],
    parameters: [
      {
        group: "main",
        parameters: {
          "particles": {
            type: "int",
            value: 1000,
            ui: {
              name: "Particles",
              min: 10,
              max: constants.maxNumParticles
            }
          },
          "updatesPerDraw": {
            type: "int",
            value: 4,
            ui: {
              name: "Updates / Draw",
              min: 1,
              max: 10,
              step: 1
            }
          }
        }
      },
      {
        group: "bloom",
        parameters: {
          "quality": {
            type: "int",
            value: 0,
            ui: {
              name: "Quality",
              min: 0,
              max: 2,
              type: "enum",
              options: ["off", "low", "high"]
            }
          },
          "steps": {
            type: "int",
            value: 0,
            ui: {
              name: "Blur steps",
              min: 3,
              max: constants.maxBlurSteps,
              step: 1
            }
          },
          "luma": {
            type: "float",
            value: 0.25,
            ui: {
              name: "Luma",
              min: 0,
              max: 1.0,
              step: 0.0001
            }
          },
          "intensity": {
            type: "float",
            value: 0.5,
            ui: {
              name: "Intensity",
              min: 0,
              max: 1.0,
              step: 0.0001
            }
          }
        }
      }
    ] as ParameterGroup[]
  }
}

export const defaultRenderConfig: RenderingConfig = {
    maxNumParticles: constants.maxNumParticles,
    maxBloomSteps: constants.maxBlurSteps,
    bloomSteps: constants.minBlurSteps,
    bloomQuality: 2,
    updatesPerDraw: 4
  };