import type { ParameterPreset } from "./parameters";
import { createStore } from "./storage";

export type StoreKeys = "presets";

export const presetStore = createStore<ParameterPreset>({
  type: "localStorage",
  key: "fibers01_presets"
});

