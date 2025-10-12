import type { ControlFactoryUniform } from "./main";

type ParameterGroup = {
    group: string;
    parameters: Record<string, ControlFactoryUniform>;
};

type ParameterGroupDescriptor = {
    id: string,
    order: number,
    displayName: string
};


export class ParameterService {
    private registry: Record<string, ParameterGroup>;
    private groups: Record<string, ParameterGroupDescriptor>;
    
    constructor() {
        this.registry = {};
        this.groups = {};
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

}
