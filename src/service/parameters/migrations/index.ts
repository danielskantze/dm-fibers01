import { generateId } from "../../../ui/util/id";
import type { ParameterPreset } from "../../parameters";

class PresetMigrationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class PresetMigrationFalseV2Error extends PresetMigrationError {
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

function v1_to_v2(legacyPreset: any): ParameterPreset {
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

export function fixBrokenV2(legacyPreset: any): ParameterPreset {
  try {
    return _fixBrokenV2(legacyPreset);
  } catch (e: unknown) {
    if (e instanceof PresetMigrationFalseV2Error) {
      return v1_to_v2(legacyPreset);
    }
  }
  throw new PresetMigrationError("Unknown error");
}

function _fixBrokenV2(legacyPreset: any): ParameterPreset {
  let data = legacyPreset.data;
  let newData: any = {};
  const groups = Object.keys(legacyPreset.data);
  let changes = 0;
  groups.map(g => {
    newData[g] = {};
    Object.entries(data[g]).forEach(([id, value]) => {
      if (!(value as any).baseValue && !(value as any).modifiers) {
        throw new PresetMigrationFalseV2Error("v2 stated but it is actually v1");
      }
      let typedValue = value as { baseValue: any; modifiers: any[] | undefined };
      typedValue.modifiers = typedValue.modifiers ?? [];
      if (typedValue.modifiers.length > 0 && !typedValue.modifiers[0].id) {
        changes++;
        newData[g][id] = {
          baseValue: typedValue.baseValue,
          modifiers: typedValue.modifiers.map((m: any) => ({
            id: generateId(),
            config: m,
          })),
        };
      } else {
        newData[g][id] = typedValue;
      }
    });
  });
  const presetV2 = { ...legacyPreset };
  presetV2.version = 2;
  console.log(
    "Migration - fixV2:",
    changes > 0 ? `Updated ${changes} parameters` : "No changes"
  );
  presetV2.data = changes > 0 ? newData : presetV2.data;
  return presetV2;
}

export function migrate(
  fromVersion: number,
  toVersion: number,
  legacyPreset: any
): ParameterPreset {
  if (fromVersion === 1 && toVersion === 1) {
    return legacyPreset;
  } else if (fromVersion === 1 && toVersion === 2) {
    return v1_to_v2(legacyPreset);
  }
  throw new PresetMigrationError(
    `Migration from ${fromVersion} to ${toVersion} not supported`
  );
}
