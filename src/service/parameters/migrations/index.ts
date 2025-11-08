import type { ParameterPreset } from "../../parameters";

class PresetMigrationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/*

V1 format

 "data": {
    "main": {
      "particles": 130000,
      "updatesPerDraw": 6,
      "seed": "fibers01",
      "audio": ""
    },


V2 format    

 "data": {
    "main": {
      "particles": { baseValue: 130000, modifiers: []},
      "updatesPerDraw": { baseValue: 6, modifiers: []},
      "seed": { baseValue: "fibers01", modifiers: []},
      "audio": { baseValue: "", modifiers: []},
    },
*/

export function migrate(
  fromVersion: number,
  toVersion: number,
  legacyPreset: any
): ParameterPreset {
  if (fromVersion === 1 && toVersion === 1) {
    return legacyPreset;
  }
  if (fromVersion === 1 && toVersion === 2) {
    if (!legacyPreset.data) {
      throw new PresetMigrationError("Preset is broken - data property is missing");
    }
    const groups = Object.keys(legacyPreset.data);
    if (groups.length === 0) {
      throw new PresetMigrationError(
        "Preset is broken - data is empty - nothing to migrate"
      );
    }
    let data = legacyPreset.data;
    let newData: any = {};
    groups.map(g => {
      newData[g] = {};
      Object.entries(data[g]).forEach(([id, value]) => {
        newData[g][id] = { baseValue: value, modifiers: [] };
      });
    });
    const presetV2 = { ...legacyPreset };
    presetV2.version = 2;
    presetV2.data = newData;
    return presetV2;
  }
  throw new PresetMigrationError(
    `Migration from ${fromVersion} to ${toVersion} not supported`
  );
}
