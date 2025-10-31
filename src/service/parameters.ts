import * as uniforms from "../gl/uniforms";
import { orderedValues } from "../render/util/dict";
import { type PublicUniform, type UniformValue } from "../types/gl/uniforms";
import type { StageName } from "../types/stage";
import { migrate } from "./parameters/migrations";

export type ParameterData = PublicUniform;
export type ParameterPresetKey = "presets";
export type ParameterGroupKey = "main" | "bloom" | StageName;

const presetFormatVersion = 1;

export type ParameterModifierTransformFn = (
  frame: number,
  value: UniformValue
) => UniformValue;

export interface ParameterModifierMapping {
  blendMode: "add" | "multiply";
  range: number;
  offset: number;
}
export interface ParameterModifier {
  mapping: ParameterModifierMapping;
  transform: ParameterModifierTransformFn;
}

export type ManagedParameter = {
  data: ParameterData;
  baseValue: UniformValue;
  modifiers: ParameterModifier[];
  value: UniformValue;
  updatedFrame: number;
};

export type ParameterGroup<G extends string> = {
  group: G;
  parameters: Record<string, ManagedParameter>;
};

export type ParameterConfigGroup<G extends string> = {
  group: G;
  parameters: Record<string, Omit<ParameterData, "location">>;
};

export type ParameterGroupDescriptor<G extends string> = {
  id: G;
  order: number;
  displayName: string;
};

export type ParameterConfig<G extends string> = {
  groups: {
    descriptors: ParameterGroupDescriptor<G>[];
    parameters: ParameterConfigGroup<G>[];
  };
};

type ParameterValues = Record<string, Record<string, UniformValue>>;

export type ParameterPreset = {
  id: string;
  name: string;
  createdAt: string;
  version: number;
  data: ParameterValues;
};

type Subscriber = {
  group: string;
  parameter: string;
  update: (value: UniformValue) => void;
};

export class NoSuchParameterError extends Error {
  private _group: string;
  private _parameter: string;

  constructor(group: string, parameter: string) {
    super(`No parameter named "${parameter} was found in group "${group}"`);
    this._parameter = parameter;
    this._group = group;
  }
  get group() {
    return this._group;
  }
  get parameterer() {
    return this._parameter;
  }
}

class ParameterService<G extends string> {
  private registry: Record<string, ParameterGroup<G>>;
  private groups: Record<G, ParameterGroupDescriptor<G>>;
  private subscribers: Subscriber[];
  private frame: number = 0;

  constructor() {
    this.registry = {};
    this.groups = {} as Record<G, ParameterGroupDescriptor<G>>;
    this.subscribers = [];
  }

  static fromConfig<G extends string>(parameterConfig: ParameterConfig<G>) {
    const instance = new ParameterService<G>();
    const {
      groups: { descriptors, parameters },
    } = parameterConfig;
    parameters.forEach(({ group, parameters: gParams }) => {
      Object.entries(gParams).forEach(([id, v]) =>
        instance.register(group as G, id, v as ParameterData)
      );
    });
    descriptors.forEach(d => {
      instance.groups[d.id as G] = d;
    });
    return instance;
  }

  subscribe(group: string, parameter: string, update: (value: UniformValue) => void) {
    const subscriber: Subscriber = { group, parameter, update };
    this.subscribers.push(subscriber);

    return () => {
      const idx = this.subscribers.indexOf(subscriber);
      this.subscribers.splice(idx, 1);
    };
  }

  lookup(param: ParameterData): [G, string] | undefined {
    const p = this.list().find(([, , data]) => param === data);
    return p ? [p[0], p[1]] : undefined;
  }

  subscribeParam(param: ParameterData, update: (value: UniformValue) => void) {
    const result = this.lookup(param);
    if (!result) {
      throw new Error("ParameterData is not found in registry");
    }
    const [group, parameter] = result;
    return this.subscribe(group, parameter, update);
  }

  private notify(group: G, parameter: string, value: UniformValue) {
    this.subscribers
      .filter(s => s.group === group && s.parameter === parameter)
      .forEach(s => s.update(value));
  }

  load(preset: ParameterPreset) {
    if (Object.entries(this.groups).length === 0) {
      throw new Error("Cannot load values without config");
    }
    if (preset.version !== presetFormatVersion) {
      preset = migrate(preset.version, presetFormatVersion, preset);
    }
    const { data } = preset;
    Object.entries(data).forEach(([group, parameters]) => {
      Object.entries(parameters).forEach(([id, data]) => {
        const desc = this.getParameter(group as G, id);
        this.setValue(group as G, id, uniforms.createFromJson(data, desc.type), true);
      });
    });
  }

  toPreset(id: string, name: string) {
    const result: ParameterPreset = {
      id,
      name,
      createdAt: new Date().toJSON(),
      version: presetFormatVersion,
      data: {},
    };
    Object.values(this.registry).forEach(({ group, parameters }) => {
      if (!result.data[group]) {
        result.data[group] = {};
      }
      Object.entries(parameters).forEach(([id, { data }]) => {
        result.data[group][id] = uniforms.valueToJson(
          this.getValue(group, id),
          data.type
        );
      });
    });
    return result;
  }

  register(group: G, parameter: string, descriptor: ParameterData) {
    if (!this.groups[group]) {
      this.groups[group] = {
        id: group,
        order: Object.keys(this.groups).length,
        displayName: group,
      };
    }
    if (!this.registry[group]) {
      this.registry[group] = {
        group,
        parameters: {},
      };
    }
    const p: ManagedParameter = {
      data: descriptor,
      baseValue: descriptor.value ?? 0,
      modifiers: [],
      value: 0,
      updatedFrame: -1,
    };
    this.registry[group].parameters[parameter] = p;
  }

  setGroupInfo(group: G, order?: number, displayName?: string) {
    if (this.groups[group]) {
      this.groups[group].order = order ?? this.groups[group].order;
      this.groups[group].displayName = displayName ?? this.groups[group].displayName;
    }
  }

  private getParameter(group: G, parameter: string): ParameterData {
    return this.getManagedParameter(group, parameter).data;
  }

  private getManagedParameter(group: G, parameter: string): ManagedParameter {
    const data = this.registry[group].parameters[parameter];
    if (!data) {
      throw new NoSuchParameterError(group, parameter);
    }
    return this.registry[group].parameters[parameter];
  }

  setValue(group: G, parameter: string, value: UniformValue, recompute: boolean = false) {
    const p = this.getManagedParameter(group, parameter);
    p.baseValue = value;
    if (recompute) {
      p.value = this.computeValue(p);
      p.updatedFrame = this.frame;
    }
    this.notify(group, parameter, p.value);
  }

  applyModifier(modifier: ParameterModifier, value: UniformValue): UniformValue {
    return modifier.transform(this.frame, value);
  }

  computeValue(parameter: ManagedParameter) {
    let value = parameter.baseValue;
    for (const m of parameter.modifiers) {
      value = this.applyModifier(m, value);
    }
    return value;
  }

  getValue<T extends UniformValue>(group: G, parameter: string): T {
    const p = this.getManagedParameter(group, parameter);
    if (p.updatedFrame != this.frame) {
      p.value = this.computeValue(p);
      p.updatedFrame = this.frame;
    }
    return p.value! as T;
  }

  setModifiers(group: G, parameter: string, modifiers: ParameterModifier[]) {
    const p = this.getManagedParameter(group, parameter);
    p.modifiers = modifiers;
  }

  listParameters(): [G, string, ManagedParameter][] {
    const result: [G, string, ManagedParameter][] = [];
    const orderedGroups = orderedValues<ParameterGroupDescriptor<G>>((a, b) => {
      return a.order - b.order;
    }, this.groups);
    orderedGroups.forEach(g => {
      const keys = Object.keys(this.registry[g.id].parameters);
      keys.forEach(k => {
        result.push([g.id, k, this.registry[g.id].parameters[k]]);
      });
    });
    return result;
  }

  list(): [G, string, ParameterData][] {
    return this.listParameters().map(([g, k, p]) => [g, k, p.data]);
  }

  update(frame: number) {
    this.frame = frame;
  }
}

export type ParameterRegistry = ParameterService<ParameterGroupKey>;

export function createRegistryFromConfig(
  config: ParameterConfig<ParameterGroupKey>
): ParameterRegistry {
  return ParameterService.fromConfig<ParameterGroupKey>(config);
}
