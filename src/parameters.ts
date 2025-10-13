import { orderedValues } from "./render/util/dict";
import type { Uniform, UniformValue } from "./types/gl/uniforms";

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
  version: number,
  data: ParameterValues
}

export class ParameterRegistry {
    private registry: Record<string, ParameterGroup>;
    private groups: Record<string, ParameterGroupDescriptor>;
    
    constructor() {
        this.registry = {};
        this.groups = {};
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
          this.setValue(group, id, data);
        });
      });
    }

    toPreset() {
      const result: ParameterPreset = {
        version: presetFormatVersion,
        data: {}
      };
      Object.values(this.registry).forEach(({group, parameters}) => {
        if (!result.data[group]) {
          result.data[group] = {};
        }
        Object.entries(parameters).forEach(([id, data]) => {
          result.data[group][id] = data.value!;
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
    }

    getValue(group: string, parameter: string): UniformValue {
        return this.getParameter(group, parameter).value!;
    }

    getNumberValue(group: string, parameter: string): number {
        return this.getParameter(group, parameter).value as number;
    }

    list(): ParameterData[] {
      const result: ParameterData[] = [];
      const orderedGroups = orderedValues<ParameterGroupDescriptor>((a, b) => {
        return a.order - b.order
      }, this.groups);
      orderedGroups.forEach((g) => {
        const keys = Object.keys(this.registry[g.id].parameters);
        keys.forEach((k) => {
          result.push(this.registry[g.id].parameters[k]);
        })
      });
      return result;
    }

}
