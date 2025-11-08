import type {
  ParameterConfigGroup,
  ParameterGroupDescriptor,
  ParameterGroupKey,
  ParameterPreset,
} from "../service/parameters";
import type { RenderingConfig } from "../types/config";
import * as constants from "./constants";

export const defaultParameters = {
  groups: {
    descriptors: [
      {
        id: "main",
        order: 1,
        displayName: "General",
      },
      {
        id: "bloom",
        order: 2,
        displayName: "Bloom",
      },
    ] as ParameterGroupDescriptor<ParameterGroupKey>[],
    parameters: [
      {
        group: "main",
        parameters: {
          seed: {
            type: "custom",
            value: "fibers01",
            domain: {
              min: 0,
              max: 0,
              type: "custom",
            },
            ui: {
              name: "Seed",
              component: "seed",
            },
          },
          audio: {
            type: "custom",
            value: "",
          },
          particles: {
            type: "int",
            value: 1000,
            domain: {
              min: 10,
              max: constants.maxNumParticles,
              type: "int",
            },
            ui: {
              name: "Particles",
            },
          },
          updatesPerDraw: {
            type: "int",
            value: 4,
            domain: {
              min: 1,
              max: 10,
              step: 1,
              type: "int",
            },
            ui: {
              name: "Steps/draw",
            },
          },
        },
      },
      {
        group: "bloom",
        parameters: {
          quality: {
            type: "int",
            value: 0,
            domain: {
              min: 0,
              max: 2,
              step: 1,
              type: "enum",
              options: ["off", "low", "high"],
            },
            ui: {
              name: "Quality",
            },
          },
          steps: {
            type: "int",
            value: 3,
            domain: {
              min: 3,
              max: constants.maxBlurSteps,
              step: 1,
              type: "int",
            },
            ui: {
              name: "Blur steps",
            },
          },
          luma: {
            type: "float",
            value: 0.25,
            domain: {
              min: 0,
              max: 1.0,
              step: 0.0001,
              type: "float",
            },
            ui: {
              name: "Luma",
            },
          },
          intensity: {
            type: "float",
            value: 0.5,
            domain: {
              min: 0,
              max: 1.0,
              step: 0.0001,
              type: "float",
            },
            ui: {
              name: "Intensity",
            },
          },
        },
      },
    ] as ParameterConfigGroup<ParameterGroupKey>[],
  },
};

export const defaultParameterPreset: ParameterPreset = {
  id: "default",
  name: "Default",
  createdAt: "2025-10-16T00:00:00.000Z",
  version: 2,
  data: {
    main: {
      particles: { baseValue: 1000, modifiers: [] },
      updatesPerDraw: { baseValue: 4, modifiers: [] },
    },
    bloom: {
      quality: { baseValue: 0, modifiers: [] },
      steps: { baseValue: 6, modifiers: [] },
      luma: { baseValue: 0.25, modifiers: [] },
      intensity: { baseValue: 0.5, modifiers: [] },
    },
  },
};

export const defaultRenderConfig: RenderingConfig = {
  maxNumParticles: constants.maxNumParticles,
  maxBloomSteps: constants.maxBlurSteps,
  bloomSteps: constants.minBlurSteps,
  bloomQuality: 2,
  updatesPerDraw: 4,
};
