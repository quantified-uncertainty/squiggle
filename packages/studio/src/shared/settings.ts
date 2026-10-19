// Personal settings, stored in ~/.squiggle-studio/settings.json (§7) and
// shared by every Studio window and tab. Keys use VS Code's dotted names.

import { z } from "zod";

export const AUTO_SAVE_DELAY_MIN = 200;
export const AUTO_SAVE_DELAY_MAX = 60_000;

const clampDelay = (ms: number) =>
  Math.min(AUTO_SAVE_DELAY_MAX, Math.max(AUTO_SAVE_DELAY_MIN, Math.round(ms)));

// One schema per key, so an invalid value only resets that key.
export const settingSchemas = {
  "files.autoSave": z.enum(["afterDelay", "onFocusChange", "off"]),
  "files.autoSaveDelay": z.number().finite().transform(clampDelay),
  "explorer.openOnArrow": z.boolean(),
  "squiggle.followChanges": z.boolean(),
  "squiggle.autorun": z.boolean(),
} as const;

export type StudioSettings = {
  [K in keyof typeof settingSchemas]: z.output<(typeof settingSchemas)[K]>;
};

export type SettingKey = keyof StudioSettings;

export const DEFAULT_SETTINGS: StudioSettings = {
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "explorer.openOnArrow": true,
  "squiggle.followChanges": false,
  "squiggle.autorun": true,
};

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as SettingKey[];

// The whole file: known keys validated, unknown keys kept (for later
// versions and hand-written notes).
export const studioSettingsSchema = z
  .object({
    "files.autoSave": settingSchemas["files.autoSave"].default(
      DEFAULT_SETTINGS["files.autoSave"]
    ),
    "files.autoSaveDelay": settingSchemas["files.autoSaveDelay"].default(
      DEFAULT_SETTINGS["files.autoSaveDelay"]
    ),
    "explorer.openOnArrow": settingSchemas["explorer.openOnArrow"].default(
      DEFAULT_SETTINGS["explorer.openOnArrow"]
    ),
    "squiggle.followChanges": settingSchemas["squiggle.followChanges"].default(
      DEFAULT_SETTINGS["squiggle.followChanges"]
    ),
    "squiggle.autorun": settingSchemas["squiggle.autorun"].default(
      DEFAULT_SETTINGS["squiggle.autorun"]
    ),
  })
  .passthrough();

export const settingsPatchSchema = z
  .object({
    "files.autoSave": settingSchemas["files.autoSave"],
    "files.autoSaveDelay": settingSchemas["files.autoSaveDelay"],
    "explorer.openOnArrow": settingSchemas["explorer.openOnArrow"],
    "squiggle.followChanges": settingSchemas["squiggle.followChanges"],
    "squiggle.autorun": settingSchemas["squiggle.autorun"],
  })
  .partial();

// Lenient parse for display: each invalid known key falls back to its
// default and is reported (a warning toast names them); never throws.
export function parseSettings(raw: unknown): {
  settings: StudioSettings;
  invalidKeys: SettingKey[];
} {
  const source =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const settings: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  const invalidKeys: SettingKey[] = [];
  for (const key of SETTING_KEYS) {
    if (!(key in source)) continue;
    const parsed = settingSchemas[key].safeParse(source[key]);
    if (parsed.success) settings[key] = parsed.data;
    else invalidKeys.push(key);
  }
  return { settings: settings as StudioSettings, invalidKeys };
}
