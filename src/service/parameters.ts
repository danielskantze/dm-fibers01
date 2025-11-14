import * as uniforms from "../gl/uniforms";
import { orderedValues } from "../render/util/dict";
import { type ParameterUniform, type UniformValue } from "../types/gl/uniforms";
import type { StageName } from "../types/stage";
import { type Subscribable } from "../util/events";
import { migrate } from "./parameters/migrations";
import { computeValue } from "./parameters/modifiers";
import { createModifier, type ModifierResources } from "./parameters/modifiers/factory";
import type { AnyModifierConfig } from "./parameters/modifiers/types";
import { ManagedParameterImpl, type ManagedParameter } from "./parameters/parameter";
import type { ModifierMutations, ParameterEvents } from "./parameters/types";
export type ParameterData = ParameterUniform;
export type ParameterPresetKey = "presets";
export type ParameterGroupKey = "main" | "bloom" | StageName;

const presetFormatVersion = 2;

export interface Parameter extends ModifierMutations {
  data: ParameterData;
  readonly baseValue: UniformValue;
  readonly value: UniformValue;
  readonly events: Subscribable<ParameterEvents>;
  readonly modifiers: ReadonlyArray<{ id: string; config: AnyModifierConfig }>;
}

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

type ParameterValues = Record<
  string,
  Record<
    string,
    { baseValue: UniformValue; modifiers: { id: string; config: AnyModifierConfig }[] }
  >
>;

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

  subscribe<T extends ParameterUniform>(
    group: string,
    parameter: string,
    update: (value: T["value"]) => void
  ) {
    const subscriber: Subscriber = {
      group,
      parameter,
      update: update as (value: UniformValue) => void,
    };
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

  private notify(group: G, parameter: string, value: UniformValue) {
    this.subscribers
      .filter(s => s.group === group && s.parameter === parameter)
      .forEach(s => s.update(value));
  }

  loadDefaults(defaultPreset: ParameterPreset) {
    return this._load(defaultPreset);
  }

  load(defaultPreset: ParameterPreset, modifierResources: ModifierResources) {
    return this._load(defaultPreset, modifierResources);
  }

  private _load(preset: ParameterPreset, modifierResources?: ModifierResources) {
    if (Object.entries(this.groups).length === 0) {
      throw new Error("Cannot load values without config");
    }
    if (preset.version !== presetFormatVersion) {
      preset = migrate(preset.version, presetFormatVersion, preset);
    } else if (preset.version === 2) {
      // Uncomment this to try harder to fix broken v2 presets.
      // We should remove this code and fixBrokenV2 as soon as everything is updated
      // preset = fixBrokenV2(preset);
    }
    const { data } = preset;
    Object.entries(data).forEach(([group, parameters]) => {
      Object.entries(parameters).forEach(([id, data]) => {
        const desc = this.getParameterData(group as G, id);
        const baseValue = data.baseValue;
        if (baseValue === undefined) {
          console.warn("baseValue not set for entry, is preset broken? Skipping...");
          return;
        }
        const value = uniforms.createFromJson(data.baseValue, desc.type);
        this.setValue(group as G, id, value, true);
        if (!modifierResources) {
          return;
        }
        const param = this.getManagedParameter(group as G, id);
        const { type, domain } = param.data;
        param.initModifiers(
          data.modifiers.map(({ id, config }) =>
            createModifier(id, config, type, domain, modifierResources!)
          )
        );
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
      Object.entries(parameters).forEach(([id, { data, modifiers }]) => {
        result.data[group][id] = {
          baseValue: uniforms.valueToJson(this.getBaseValue(group, id), data.type),
          modifiers: modifiers.map(m => ({ id: m.id, config: m.config })),
        };
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

    const initialValue = uniforms.createFromJson(descriptor.value ?? 0, descriptor.type);

    const p = new ManagedParameterImpl({
      data: descriptor,
      baseValue: initialValue,
      modifiers: [],
      value: 0,
      updatedFrame: -1,
    });
    this.registry[group].parameters[parameter] = p;
  }

  setGroupInfo(group: G, order?: number, displayName?: string) {
    if (this.groups[group]) {
      this.groups[group].order = order ?? this.groups[group].order;
      this.groups[group].displayName = displayName ?? this.groups[group].displayName;
    }
  }

  private getParameterData(group: G, parameter: string): ParameterData {
    return this.getManagedParameter(group, parameter).data;
  }

  public getParameter(group: G, parameter: string): Parameter {
    return this.getManagedParameter(group, parameter);
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
      p.value = computeValue(this.frame, p);
      p.updatedFrame = this.frame;
    }
    this.notify(group, parameter, p.baseValue);
  }

  getValue<T extends UniformValue>(group: G, parameter: string): T {
    const p = this.getManagedParameter(group, parameter);
    if (p.updatedFrame != this.frame) {
      p.value = computeValue(this.frame, p);
      p.updatedFrame = this.frame;
    }
    return p.value! as T;
  }

  getBaseValue<T extends UniformValue>(group: G, parameter: string): T {
    const p = this.getManagedParameter(group, parameter);
    return p.baseValue! as T;
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
