import { createCosPalette } from "./components/cos-palette";
import { createScalar } from "./components/scalar";
import { createSeed } from "./components/seed";
import type { ParameterComponent } from "./components/types";
import { createVec3 } from "./components/vec3";
import { createVector } from "./components/vector";

export type ComponentFactory = (props: any) => ParameterComponent;

const factories: Record<string, ComponentFactory> = {
  "cos-palette": createCosPalette,
  seed: createSeed,
  vector: createVector,
  vec3: createVec3,
  scalar: createScalar,
};

export function getFactoryFor(name: string): (props: any) => ParameterComponent {
  const factory = factories[name];
  if (!factory) {
    throw new Error(`No factory for component ${name}`);
  }
  return factory;
}
