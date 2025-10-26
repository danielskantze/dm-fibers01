import { createCosPalette } from "./components/cos-palette";
import { createScalar } from "./components/scalar";
import { createSeed } from "./components/seed";
import { createVector } from "./components/vector";
import type { Component } from "./components/types";

export type ComponentFactory = (props: any) => Component;

const registry: Record<string, ComponentFactory> = {
  "cos-palette": props => createCosPalette(props.values, props.onChange),
  seed: props => createSeed(props),
  vector: props => createVector(props),
  scalar: props => createScalar(props),
};

export function getFactoryFor(type: string): ComponentFactory {
  if (type in registry) {
    return registry[type];
  }
  return registry["scalar"]; // Default fallback
}
