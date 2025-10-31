import type {
  ParameterGroup,
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
              name: "Particles",
              min: 10,
              max: constants.maxNumParticles,
            },
          },
          updatesPerDraw: {
            type: "int",
            value: 4,
            domain: {
              name: "Steps/draw",
              min: 1,
              max: 10,
              step: 1,
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
              name: "Quality",
              min: 0,
              max: 2,
              step: 1,
              type: "enum",
              options: ["off", "low", "high"],
            },
          },
          steps: {
            type: "int",
            value: 3,
            domain: {
              name: "Blur steps",
              min: 3,
              max: constants.maxBlurSteps,
              step: 1,
            },
          },
          luma: {
            type: "float",
            value: 0.25,
            domain: {
              name: "Luma",
              min: 0,
              max: 1.0,
              step: 0.0001,
            },
          },
          intensity: {
            type: "float",
            value: 0.5,
            domain: {
              name: "Intensity",
              min: 0,
              max: 1.0,
              step: 0.0001,
            },
          },
        },
      },
    ] as ParameterGroup<ParameterGroupKey>[],
  },
};

export const defaultParameterPreset: ParameterPreset = {
  id: "default",
  name: "Default",
  createdAt: "2025-10-16T00:00:00.000Z",
  version: 1,
  data: {
    main: {
      particles: 1000,
      updatesPerDraw: 4,
    },
    bloom: {
      quality: 0,
      steps: 6,
      luma: 0.25,
      intensity: 0.5,
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
