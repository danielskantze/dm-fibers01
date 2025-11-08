import { fromScalarFactory } from "../../../math/generic/creation";
import type {
  MappedUniformValue,
  UniformType,
  UniformValueDomain,
} from "../../../types/gl/uniforms";
import { createEnumMap } from "../../../util/enum";
import type { Handler } from "../../../util/events";
import type {
  AudioAnalysisEvents,
  AudioAnalysisType,
  PublicAudioStatsCollector,
} from "../../audio/audio-stats";
import type { BeatDetectorState } from "../../audio/beat-detector";
import type { LevelsMonitorState } from "../../audio/levels-monitor";
import type { Parameter } from "../../parameters";
import { BaseModifier, type BaseModifierConfig } from "../modifiers";

export type ScalarAnalysisType = Omit<AudioAnalysisType, "fft">;
export type ScalarAnalysisProperty = keyof BeatDetectorState | keyof LevelsMonitorState;

export const audioAnalysisTypeEnumMap = createEnumMap<"levels" | "beat">([
  "levels",
  "beat",
]);

export const audioLevelAnalysisPropertyEnumMap = createEnumMap<ScalarAnalysisProperty>([
  "peak",
  "avgPeak",
  "rms",
  "avgRms",
  "avgRms3",
  "avgRms5",
]);

export const audioBeatAnalysisPropertyEnumMap = createEnumMap<ScalarAnalysisProperty>([
  "timeSinceLastBeat",
]);

export interface AudioAnalysisModifierConfig extends BaseModifierConfig {
  type: "audio";
  analysis: {
    type: ScalarAnalysisType;
    property: ScalarAnalysisProperty;
    declineFalloff: number;
  };
}

const defaultConfig: AudioAnalysisModifierConfig = {
  type: "audio",
  analysis: {
    type: "levels",
    property: "avgRms",
    declineFalloff: 0.0,
  },
  offset: 0.0,
  range: 0.25,
  blendMode: "add",
};

export class AudioAnalysisModifier<T extends UniformType> extends BaseModifier<
  T,
  AudioAnalysisModifierConfig
> {
  private _handler: Handler<AudioAnalysisEvents, "update"> | null = null;
  private _analyser: PublicAudioStatsCollector;
  private _analysisType: ScalarAnalysisType;
  private _analysisProperty: ScalarAnalysisProperty;
  private _declineFalloff: number = 0.0;
  private _value: number = 0;
  private _currentValue: number = 0;
  private _fromScalarFn: any;

  constructor(
    id: string | undefined,
    type: T,
    domain: UniformValueDomain,
    analyzer: PublicAudioStatsCollector,
    config: AudioAnalysisModifierConfig
  ) {
    super(id, type, domain.max - domain.min, config);
    this._analysisType = config.analysis.type as ScalarAnalysisType;
    this._analysisProperty = config.analysis.property;
    this._analyser = analyzer;
    this._declineFalloff = config.analysis.declineFalloff;
    this._fromScalarFn = fromScalarFactory[this.type];
    if (this.type === "int") {
      this._fromScalarFn = fromScalarFactory["int"];
    }
    this._subscribe();
  }
  protected _getSpecificConfig(): Omit<
    AudioAnalysisModifierConfig,
    keyof BaseModifierConfig
  > {
    return {
      analysis: {
        type: this._analysisType,
        property: this._analysisProperty,
        declineFalloff: this._declineFalloff,
      },
    };
  }
  protected _applySpecificConfig(config: AudioAnalysisModifierConfig): void {
    this._analysisProperty = config.analysis.property;
    this._analysisType = config.analysis.type;
    this._declineFalloff = config.analysis.declineFalloff;
  }
  _subscribe() {
    this._handler = ({ stats }) => {
      this._value = (stats[this._analysisType as AudioAnalysisType] as any)[
        this._analysisProperty
      ];
    };
    this._analyser.events.subscribe("update", this._handler);
  }
  _unsubscribe() {
    if (this._handler) {
      this._analyser.events.unsubscribe("update", this._handler!);
      this._handler = null;
    }
  }
  generate(_frame: number): MappedUniformValue<T> {
    if (this._currentValue > this._value) {
      this._currentValue =
        this._value * (1.0 - this._declineFalloff) +
        this._currentValue * this._declineFalloff;
    } else {
      this._currentValue = this._value;
    }
    return this._fromScalarFn(this._currentValue) as MappedUniformValue<T>;
  }

  static addTo(
    p: Parameter,
    analyzer: PublicAudioStatsCollector,
    config: Partial<AudioAnalysisModifierConfig>,
    id?: string
  ) {
    const { type, domain } = p.data;
    const fullConfig = { ...defaultConfig, ...config };
    p.addModifier(
      new AudioAnalysisModifier<UniformType>(id, type!, domain, analyzer, fullConfig)
    );
  }
}
