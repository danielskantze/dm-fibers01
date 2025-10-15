import * as uniforms from "./gl/uniforms";
import { orderedValues } from "./render/util/dict";
import { type Uniform, type UniformValue } from "./types/gl/uniforms";

export type ParameterData = Omit<Uniform, "location" | "slot">;

const presetFormatVersion = 1.0;

export type ParameterGroup = {
    group: string;
    parameters: Record<string, ParameterData>;
};

export type ParameterGroupDescriptor = {
    id: string,
    order: number,
    displayName: string
};

export type ParameterConfig = {
  groups: {
    descriptors: ParameterGroupDescriptor[],
    parameters: ParameterGroup[]
  }
};

type ParameterValues = Record<string, Record<string, UniformValue>>;

export type ParameterPreset = {
  id: string,
  name: string,
  createdAt: string,
  version: number,
  data: ParameterValues
}

type Subscriber = {
  group: string,
  parameter: string,
  update: (value: UniformValue) => void
};

export class ParameterRegistry {
    private registry: Record<string, ParameterGroup>;
    private groups: Record<string, ParameterGroupDescriptor>;
    private subscribers: Subscriber[];

    constructor() {
        this.registry = {};
        this.groups = {};
        this.subscribers = [];
    }

    static fromConfig(parameterConfig: ParameterConfig) {
      const instance = new ParameterRegistry();
      const { groups: { descriptors, parameters }} = parameterConfig;
      parameters.forEach(({group, parameters: gParams }) => {
        Object.entries(gParams).forEach(([id, v]) => (
          instance.register(group, id, v as ParameterData)))
        }
      );
      descriptors.forEach((d) => {
        instance.groups[d.id] = d;
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

    lookup(param: ParameterData): [string, string] | undefined {
      const p = this.list().find(([g, p, data]) => (param === data));
      return p ? [p[0], p[1]] : undefined;
    }

    subscribeParam(param: ParameterData, update: (value: UniformValue) => void) {
      const result = this.lookup(param);
      if (!result) {
        throw new Error("ParameterData is not found in registry");
      }
      const [ group, parameter ] = result;
      return this.subscribe(group, parameter, update);
    }

    private notify(group: string, parameter: string, value: UniformValue) {
      const subscriber = this.subscribers.find(
        (s) => (s.group === group && s.parameter === parameter)
      );
      subscriber?.update(value);
    }

    load(preset: ParameterPreset) {
      if (Object.entries(this.groups).length === 0) {
        throw new Error("Cannot load values without config");
      }
      const { version, data } = preset;
      if (version !== presetFormatVersion) {
        throw new Error("Wrong preset version - migration not supported yet");
      }
      Object.entries(data).forEach(([group, parameters]) => {
        Object.entries(parameters).forEach(([id, data]) => {
          const desc = this.getParameter(group, id);
          this.setValue(group, id, uniforms.createFromJson(data, desc.type));
        });
      });
    }

    toPreset(id: string, name: string) {
      const result: ParameterPreset = {
        id,
        name,
        createdAt: (new Date()).toJSON(),
        version: presetFormatVersion,
        data: {}
      };
      Object.values(this.registry).forEach(({group, parameters}) => {
        if (!result.data[group]) {
          result.data[group] = {};
        }
        Object.entries(parameters).forEach(([id, data]) => {
          result.data[group][id] = uniforms.valueToJson(data.value, data.type);
        });
      });
      return result;
    }

    register(group: string, parameter: string, descriptor: ParameterData) {
        if (!this.groups[group]) {
            this.groups[group] = {
                id: group,
                order: Object.keys(this.groups).length,
                displayName: group
            };
        }
        if (!this.registry[group]) {
            this.registry[group] = {
                group,
                parameters: {}
            }
        }
        this.registry[group].parameters[parameter] = descriptor;
    }

    setGroupInfo(group: string, order?: number, displayName?: string) {
        if (this.groups[group]) {
            this.groups[group].order = order ?? this.groups[group].order;
            this.groups[group].displayName = displayName ?? this.groups[group].displayName;
        }
    }

    getParameter(group: string, parameter: string): ParameterData {
        return this.registry[group].parameters[parameter];
    }
    
    setValue(group: string, parameter: string, value: UniformValue) {
        this.getParameter(group, parameter).value = value;
        this.notify(group, parameter, value);
    }

    getValue(group: string, parameter: string): UniformValue {
        return this.getParameter(group, parameter).value!;
    }

    getNumberValue(group: string, parameter: string): number {
        return this.getParameter(group, parameter).value as number;
    }

    list(): [string, string, ParameterData][] {
      const result: [string, string, ParameterData][] = [];
      const orderedGroups = orderedValues<ParameterGroupDescriptor>((a, b) => {
        return a.order - b.order
      }, this.groups);
      orderedGroups.forEach((g) => {
        const keys = Object.keys(this.registry[g.id].parameters);
        keys.forEach((k) => {
          result.push([g.id, k, this.registry[g.id].parameters[k]]);
        })
      });
      return result;
    }

}
