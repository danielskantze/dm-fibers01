import type { ParameterPreset } from "../../parameters";

class PresetMigrationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function migrate(
  fromVersion: number,
  toVersion: number,
  presets: any
): ParameterPreset {
  throw new PresetMigrationError(
    `Migration from ${fromVersion} to ${toVersion} not supported`
  );
}
