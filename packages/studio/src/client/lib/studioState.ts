// Personal settings and UI state (§7). The interface is WP0's; this
// implementation keeps everything in localStorage (per origin), and WP7
// replaces it with the server-backed ~/.squiggle-studio/{settings,state}.json
// (localStorage then becomes the first-paint cache).
//
// - Global state: one value per key, shared by every root (layout, palette
//   MRU, …).
// - Root state: one slice per absolute root path (active file, MRU, views, …).
//   A root's slice is never written before it has loaded.
// - Settings: StudioSettings, validated per key (settings.ts); published as
//   `config.<key>` context keys.
//
// All values are validated with the caller's zod schema on read; an invalid
// stored value reads as the fallback.

import { useMemo, useSyncExternalStore } from "react";
import { z } from "zod";

import {
  DEFAULT_SETTINGS,
  parseSettings,
  type SettingKey,
  SETTING_KEYS,
  type StudioSettings,
} from "../../shared/settings.js";
import {
  createContextPublisher,
  patchContextKeys,
} from "../commands/context.js";

const GLOBAL_KEY = "squiggle-studio:state:global";
const SETTINGS_KEY = "squiggle-studio:settings";
const rootKey = (root: string) => `squiggle-studio:state:root:${root}`;

// Writes are debounced like the server-backed store will be.
const WRITE_DEBOUNCE_MS = 300;

const recordSchema = z.record(z.string(), z.unknown());

function readRecord(key: string): Record<string, unknown> {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return {};
    const parsed = recordSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

function writeRecord(key: string, value: Record<string, unknown>) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private windows and blocked storage: state lasts for this page only.
  }
}

let globalState: Record<string, unknown> = {};
const rootStates = new Map<string, Record<string, unknown>>();
let settings: StudioSettings = { ...DEFAULT_SETTINGS };
let initialized = false;
const listeners = new Set<() => void>();
const pendingWrites = new Map<string, () => void>();
let writeTimer: ReturnType<typeof setTimeout> | undefined;
let configPublisher: number | undefined;

function notify() {
  for (const cb of [...listeners]) cb();
}

function publishConfig() {
  configPublisher ??= createContextPublisher();
  const keys: Record<string, unknown> = {};
  for (const key of SETTING_KEYS) keys[`config.${key}`] = settings[key];
  patchContextKeys(configPublisher, keys);
}

function ensureInitialized() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  globalState = readRecord(GLOBAL_KEY);
  settings = parseSettings(readRecord(SETTINGS_KEY)).settings;
  publishConfig();
  window.addEventListener("pagehide", flushStudioState);
  // Other tabs of the same origin.
  window.addEventListener("storage", (e) => {
    if (e.key === GLOBAL_KEY) globalState = readRecord(GLOBAL_KEY);
    else if (e.key === SETTINGS_KEY) handleSettingsChanged();
    else if (e.key?.startsWith("squiggle-studio:state:root:")) {
      const root = e.key.slice("squiggle-studio:state:root:".length);
      if (rootStates.has(root)) rootStates.set(root, readRecord(e.key));
    } else return;
    notify();
  });
}

function scheduleWrite(key: string, write: () => void) {
  pendingWrites.set(key, write);
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(flushStudioState, WRITE_DEBOUNCE_MS);
}

// Writes pending changes now (also on pagehide).
export function flushStudioState(): void {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = undefined;
  const writes = [...pendingWrites.values()];
  pendingWrites.clear();
  for (const write of writes) write();
}

export function subscribeStudioState(cb: () => void): () => void {
  ensureInitialized();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function parseOr<T>(raw: unknown, schema: z.ZodType<T>, fallback: T): T {
  if (raw === undefined) return fallback;
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : fallback;
}

// ── Global state ───────────────────────────────────────────────────────────

export function getGlobalState<T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T
): T {
  ensureInitialized();
  return parseOr(globalState[key], schema, fallback);
}

export function setGlobalState(key: string, value: unknown): void {
  ensureInitialized();
  if (Object.is(globalState[key], value)) return;
  globalState = { ...globalState, [key]: value };
  scheduleWrite(GLOBAL_KEY, () => writeRecord(GLOBAL_KEY, globalState));
  notify();
}

export function useGlobalState<T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T
): [T, (v: T) => void] {
  ensureInitialized();
  const raw = useSyncExternalStore(
    subscribeStudioState,
    () => globalState[key],
    () => globalState[key]
  );
  // `schema` and `fallback` are expected to be stable (module constants).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => parseOr(raw, schema, fallback), [raw]);
  return [value, (v: T) => setGlobalState(key, v)];
}

// ── Root state ─────────────────────────────────────────────────────────────

function rootSlice(root: string): Record<string, unknown> | undefined {
  return rootStates.get(root);
}

// Loads a root's slice (resetForRoot awaits it before reading or writing).
export async function loadRootState(
  root: string
): Promise<Record<string, unknown>> {
  ensureInitialized();
  let slice = rootStates.get(root);
  if (!slice) {
    slice = readRecord(rootKey(root));
    rootStates.set(root, slice);
    notify();
  }
  return slice;
}

export function isRootStateLoaded(root: string): boolean {
  return rootStates.has(root);
}

export function getRootState<T>(
  root: string,
  key: string,
  schema: z.ZodType<T>,
  fallback: T
): T {
  return parseOr(rootSlice(root)?.[key], schema, fallback);
}

// Ignored (with a warning) before the root's slice has loaded, so that a
// fresh page never overwrites saved state (#4).
export function setRootState(root: string, key: string, value: unknown): void {
  const slice = rootSlice(root);
  if (!slice) {
    console.warn(`studioState: ${root} isn't loaded yet; not saving "${key}"`);
    return;
  }
  if (Object.is(slice[key], value)) return;
  const next = { ...slice, [key]: value };
  rootStates.set(root, next);
  scheduleWrite(rootKey(root), () => writeRecord(rootKey(root), next));
  notify();
}

export function useRootState<T>(
  root: string | undefined,
  key: string,
  schema: z.ZodType<T>,
  fallback: T
): [T, (v: T) => void] {
  ensureInitialized();
  const raw = useSyncExternalStore(
    subscribeStudioState,
    () => (root === undefined ? undefined : rootSlice(root)?.[key]),
    () => undefined
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => parseOr(raw, schema, fallback), [raw]);
  return [
    value,
    (v: T) => {
      if (root !== undefined) setRootState(root, key, v);
    },
  ];
}

// ── Settings ───────────────────────────────────────────────────────────────

export function getSettings(): StudioSettings {
  ensureInitialized();
  return settings;
}

export function useSetting<K extends SettingKey>(key: K): StudioSettings[K] {
  ensureInitialized();
  return useSyncExternalStore(
    subscribeStudioState,
    () => settings[key],
    () => DEFAULT_SETTINGS[key]
  );
}

export async function updateSettings(
  patch: Partial<StudioSettings>
): Promise<void> {
  ensureInitialized();
  const { settings: next } = parseSettings({ ...settings, ...patch });
  settings = next;
  writeRecord(SETTINGS_KEY, { ...readRecord(SETTINGS_KEY), ...patch });
  publishConfig();
  notify();
}

// Re-reads the settings (on the server's `settings-changed` event, or another
// tab's write).
export function handleSettingsChanged(): void {
  ensureInitialized();
  settings = parseSettings(readRecord(SETTINGS_KEY)).settings;
  publishConfig();
  notify();
}

// Publish defaults right away, so `config.*` keys exist before first render.
ensureInitialized();
