import type { ParameterPreset } from "./parameters";
import { createStore } from "./storage/local";

export type StoreKeys = "presets";

export const presetStore = createStore<ParameterPreset>({
  type: "localStorage",
  key: "fibers01_presets"
});

