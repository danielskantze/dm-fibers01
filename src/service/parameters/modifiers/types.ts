import { createEnumMap } from "../../../util/enum";
import type { AudioAnalysisModifierConfig } from "./audio-analysis-modifier";
import type { LFOConfig } from "./lfo-modifier";
import type { BlendMode as MathBlendMode } from "../../../math/types";
import type { SmootherConfig } from "./smoother";

export type AnyModifierConfig = LFOConfig | AudioAnalysisModifierConfig | SmootherConfig;

export type BlendMode = MathBlendMode;

export const blendModeEnumMap = createEnumMap<BlendMode>([
  "add",
  "multiply",
  "overwrite",
]);
