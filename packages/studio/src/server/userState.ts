import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import {
  API_ERROR_CODES,
  type PatchStateRequest,
  type SettingsResponse,
  type StateResponse,
} from "../shared/api.js";
import { settingsPatchSchema } from "../shared/settings.js";
import { atomicWrite, serialize } from "./files.js";
import { isErrno, PathError } from "./paths.js";

// Personal settings and UI state in ~/.squiggle-studio (§7), shared by every
// Studio window and tab whatever its port:
// - state.json: machine-managed UI state, `global` plus one slice per
//   absolute root. PATCH merges per key: the file is re-read, merged and
//   written atomically, serialized per file within this process (several
//   Electron windows); across processes the last writer wins per key. An
//   invalid file reads as empty (with a console warning) and is overwritten
//   on the next write. The 50 most recently used roots are kept.
// - settings.json: hand-editable personal settings. A file that doesn't
//   parse is reported and never written.

export const MAX_STATE_ROOTS = 50;
const SETTINGS_DEBOUNCE_MS = 100;

const recordSchema = z.record(z.string(), z.unknown());

const stateFileSchema = z.object({
  version: z.literal(1),
  global: recordSchema,
  roots: z.record(
    z.string(),
    z.object({ usedAt: z.number(), state: recordSchema })
  ),
});
type StateFile = z.infer<typeof stateFileSchema>;

const emptyState = (): StateFile => ({ version: 1, global: {}, roots: {} });

export type UserState = {
  dir: string;
  statePath: string;
  settingsPath: string;
  getState(root?: string): Promise<StateResponse>;
  patchState(patch: PatchStateRequest): Promise<void>;
  getSettings(): Promise<SettingsResponse>;
  // 400 for an invalid patch; 409 "settings-invalid" while settings.json on
  // disk doesn't parse.
  putSettings(patch: unknown): Promise<SettingsResponse>;
  // Calls `onChange` (debounced) whenever settings.json changes, whoever
  // wrote it. Returns a function that stops watching.
  watchSettings(onChange: () => void): () => void;
};

// An absolute root path, as the key of its slice.
function rootKey(root: string): string {
  if (!path.isAbsolute(root)) {
    throw new PathError(`The root must be an absolute path, got "${root}"`);
  }
  return path.resolve(root);
}

export function createUserState(dir: string): UserState {
  const statePath = path.join(dir, "state.json");
  const settingsPath = path.join(dir, "settings.json");

  async function readStateFile(): Promise<StateFile> {
    let raw: string;
    try {
      raw = await fsp.readFile(statePath, "utf-8");
    } catch (e) {
      if (isErrno(e, "ENOENT")) return emptyState();
      throw e;
    }
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      console.warn(
        `Squiggle Studio: ${statePath} isn't valid JSON; using defaults (it will be overwritten)`
      );
      return emptyState();
    }
    const parsed = stateFileSchema.safeParse(json);
    if (!parsed.success) {
      console.warn(
        `Squiggle Studio: ${statePath} has an unexpected shape; using defaults (it will be overwritten)`
      );
      return emptyState();
    }
    return parsed.data;
  }

  type SettingsFile =
    | { ok: true; settings: Record<string, unknown>; exists: boolean }
    | { ok: false; error: string };

  async function readSettingsFile(): Promise<SettingsFile> {
    let raw: string;
    try {
      raw = await fsp.readFile(settingsPath, "utf-8");
    } catch (e) {
      if (isErrno(e, "ENOENT"))
        return { ok: true, settings: {}, exists: false };
      throw e;
    }
    if (raw.trim() === "") return { ok: true, settings: {}, exists: true };
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      return {
        ok: false,
        error: `${settingsPath} isn't valid JSON (${e instanceof Error ? e.message : String(e)})`,
      };
    }
    const parsed = recordSchema.safeParse(json);
    if (!parsed.success || Array.isArray(json)) {
      return { ok: false, error: `${settingsPath} must contain a JSON object` };
    }
    return { ok: true, settings: parsed.data, exists: true };
  }

  // Settings watchers waiting for the folder to exist.
  const waiting = new Set<() => void>();

  async function writeJson(file: string, value: unknown) {
    await fsp.mkdir(dir, { recursive: true });
    for (const start of [...waiting]) start();
    await atomicWrite(file, `${JSON.stringify(value, null, 2)}\n`);
  }

  return {
    dir,
    statePath,
    settingsPath,

    async getState(root) {
      const state = await readStateFile();
      const slice = root ? state.roots[rootKey(root)]?.state : undefined;
      return { global: state.global, root: slice ?? {} };
    },

    async patchState(patch) {
      const key = patch.root ? rootKey(patch.root.path) : undefined;
      await serialize(statePath, async () => {
        const state = await readStateFile();
        if (patch.global) state.global = { ...state.global, ...patch.global };
        if (key && patch.root) {
          state.roots[key] = {
            usedAt: Date.now(),
            state: { ...(state.roots[key]?.state ?? {}), ...patch.root.patch },
          };
          const byUse = Object.entries(state.roots).sort(
            ([, a], [, b]) => b.usedAt - a.usedAt
          );
          state.roots = Object.fromEntries(byUse.slice(0, MAX_STATE_ROOTS));
        }
        await writeJson(statePath, state);
      });
    },

    async getSettings() {
      const file = await readSettingsFile();
      return file.ok
        ? { settings: file.settings, path: settingsPath }
        : { settings: {}, path: settingsPath, error: file.error };
    },

    putSettings(patch) {
      const parsed = settingsPatchSchema.strict().safeParse(patch);
      if (!parsed.success) {
        return Promise.reject(
          new PathError(`Invalid settings: ${parsed.error.message}`)
        );
      }
      return serialize(settingsPath, async () => {
        const file = await readSettingsFile();
        if (!file.ok) {
          throw new PathError(
            `Not saved: ${file.error}. Fix or delete the file to change settings from Studio.`,
            409,
            API_ERROR_CODES.settingsInvalid
          );
        }
        const settings = { ...file.settings, ...parsed.data };
        await writeJson(settingsPath, settings);
        return { settings, path: settingsPath };
      });
    },

    watchSettings(onChange) {
      let watcher: fs.FSWatcher | undefined;
      let timer: NodeJS.Timeout | undefined;
      let retry: NodeJS.Timeout | undefined;
      let stopped = false;
      const changed = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          timer = undefined;
          if (!stopped) onChange();
        }, SETTINGS_DEBOUNCE_MS);
      };
      const start = () => {
        if (stopped || watcher) return;
        waiting.delete(start);
        if (retry) clearTimeout(retry);
        retry = undefined;
        try {
          // Recursive, so that macOS reports in-place edits of the file too
          // (a plain directory watch only sees entries come and go).
          watcher = fs.watch(dir, { recursive: true }, (_type, filename) => {
            if (!filename || filename.toString() === "settings.json") {
              changed();
            }
          });
        } catch {
          // The folder doesn't exist yet: start once this module creates it,
          // or look again later (another process may create it).
          watcher = undefined;
          waiting.add(start);
          retry = setTimeout(start, 2000).unref();
          return;
        }
        watcher.on("error", () => {
          watcher?.close();
          watcher = undefined;
          waiting.add(start);
          retry = setTimeout(start, 2000).unref();
        });
      };
      start();
      return () => {
        stopped = true;
        waiting.delete(start);
        watcher?.close();
        if (timer) clearTimeout(timer);
        if (retry) clearTimeout(retry);
      };
    },
  };
}
