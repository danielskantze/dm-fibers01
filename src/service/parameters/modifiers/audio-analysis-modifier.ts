import { fromScalarFactory } from "../../../math/generic/creation";
import type {
  MappedUniformValue,
  UniformType,
  UniformValueDomain,
} from "../../../types/gl/uniforms";
import type { Handler } from "../../../util/events";
import { StreamLogging } from "../../../util/logging";
import type {
  AudioAnalysisEvents,
  AudioAnalysisType,
  PublicAudioStatsCollector,
} from "../../audio/audio-stats";
import type { BeatDetectorState } from "../../audio/beat-detector";
import type { LevelsMonitorState } from "../../audio/levels-monitor";
import type { Parameter } from "../../parameters";
import { BaseModifier, type BaseModifierConfig } from "../modifiers";

type ScalarAnalysisType = Omit<AudioAnalysisType, "fft">;
type ScalarAnalysisProperty = keyof BeatDetectorState | keyof LevelsMonitorState;

interface Config extends BaseModifierConfig {
  analysis: {
    type: ScalarAnalysisType;
    property: ScalarAnalysisProperty;
    declineFalloff: number;
  };
}

const defaultConfig: Config = {
  analysis: {
    type: "levels",
    property: "avgRms",
    declineFalloff: 0.0,
  },
  offset: 0.0,
  range: 0.25,
  blendMode: "add",
};

export class AudioAnalysisModifier<T extends UniformType> extends BaseModifier<T> {
  private _handler: Handler<AudioAnalysisEvents, "update"> | null = null;
  private _analyser: PublicAudioStatsCollector;
  private _analysisType: AudioAnalysisType;
  private _analysisProperty: ScalarAnalysisProperty;
  private _declineFalloff: number = 0.0;
  private _value: number = 0;
  private _currentValue: number = 0;
  private _fromScalarFn: any;

  constructor(
    type: T,
    domain: UniformValueDomain,
    analyzer: PublicAudioStatsCollector,
    config: Config
  ) {
    super(type, domain.max - domain.min, config);
    this._analysisType = config.analysis.type as AudioAnalysisType;
    this._analysisProperty = config.analysis.property;
    this._analyser = analyzer;
    this._declineFalloff = config.analysis.declineFalloff;
    this._fromScalarFn = fromScalarFactory[this.type];
    if (this.type === "int") {
      this._fromScalarFn = fromScalarFactory["int"];
    }
    this._subscribe();
  }
  _subscribe() {
    this._handler = ({ stats }) => {
      this._value = (stats[this._analysisType] as any)[this._analysisProperty];
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
    config: Partial<Config>
  ) {
    const { type, domain } = p.data;
    const fullConfig = { ...defaultConfig, ...config };
    p.modifiers.push(
      new AudioAnalysisModifier<UniformType>(type!, domain, analyzer, fullConfig)
    );
  }
}
