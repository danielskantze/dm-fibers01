import { createEnumMap } from "../../../util/enum";
import type { AudioAnalysisModifierConfig } from "./audio-analysis-modifier";
import type { LFOConfig } from "./lfo-modifier";

export type AnyModifierConfig = LFOConfig | AudioAnalysisModifierConfig;

export type BlendMode = "add" | "multiply";

export const blendModeEnumMap = createEnumMap<BlendMode>(["add", "multiply"]);
