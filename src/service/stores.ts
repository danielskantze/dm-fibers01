import type { ParameterPreset } from "./parameters";
import { createArray, createObject } from "./storage/local";
import type { UserSettings } from "./user-settings";

export type StoreKeys = "presets";

export const presetStore = createArray<ParameterPreset>({
  type: "localStorage",
  key: "fibers01_presets",
});

export const userSettingsStore = createObject<UserSettings>(
  {
    type: "localStorage",
    key: "fibers01_userSettings",
  },
  {
    presetId: "default",
  }
);
