import type { UniformType, UniformValueDomain } from "../../../types/gl/uniforms";
import type { PublicAudioStatsCollector } from "../../audio/audio-stats";
import { AudioAnalysisModifier } from "./audio-analysis-modifier";
import { LFOModifier } from "./lfo-modifier";
import type { AnyModifierConfig } from "./types";

export type ModifierResources = {
  audioAnalyzer: PublicAudioStatsCollector;
};

export function createModifier(
  id: string,
  config: AnyModifierConfig,
  type: UniformType | undefined,
  domain: UniformValueDomain,
  resources: ModifierResources
) {
  switch (config.type) {
    case "lfo":
      return new LFOModifier(id, type ?? "float", domain, config);
    case "audio":
      return new AudioAnalysisModifier(
        id,
        type ?? "float",
        domain,
        resources.audioAnalyzer,
        config
      );
  }
}
