import type { ControlFactoryUniform } from "./main";
import { orderedValues } from "./render/util/dict";

export type ParameterGroup = {
    group: string;
    parameters: Record<string, ControlFactoryUniform>;
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
          instance.register(group, id, v as ControlFactoryUniform)))
        }
      );
      descriptors.forEach((d) => (
        instance.setGroupInfo(d.id, d.order, d.displayName)
      ));
      return instance;
    }

    register(group: string, parameter: string, descriptor: ControlFactoryUniform) {
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

    getParameter(group: string, parameter: string): ControlFactoryUniform {
        return this.registry[group].parameters[parameter];
    }

    getNumberValue(group: string, parameter: string): number {
        return this.getParameter(group, parameter).value as number;
    }

    setNumberValue(group: string, parameter: string, value: number) {
        this.getParameter(group, parameter).value = value;
    }

    list(): ControlFactoryUniform[] {
      const result: ControlFactoryUniform[] = [];
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
