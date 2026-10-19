// Personal settings and UI state (§7), stored by the Studio server in
// ~/.squiggle-studio/{settings,state}.json and so shared by every Studio
// window and tab, whatever its port (the Electron app gives each window a
// random one, §2.2).
//
// - Global state: one value per key, shared by every root (layout, palette
//   MRU, …).
// - Root state: one slice per absolute root path (active file, MRU, views, …).
//   A root's slice is never written before it has loaded (#4).
// - Settings: StudioSettings, validated per key (settings.ts); published as
//   `config.<key>` context keys.
//
// Reads are synchronous, from memory: first a localStorage copy (the
// first-paint cache), then whatever the server answers. Writes update memory
// at once and reach the server debounced (300 ms, per key: PATCH merges
// keys), flushed on pagehide and when the page is hidden, with keepalive.
// Settings are written at once. Global state and settings are re-read from
// the server when the window gets focus or becomes visible, and settings on
// the server's `settings-changed` event (handleSettingsChanged); a root's
// slice is re-read by each loadRootState.
//
// When the server has no state routes (404: an older server) or refuses them
// (403: --allow-network, §2.10), localStorage is the store, per origin, as
// before. In embed mode (`?embed=1`, what `render` uses) nothing is read or
// written: renders use the defaults, whatever the user's state.
//
// All values are validated with the caller's zod schema on read; an invalid
// stored value reads as the fallback.

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { z } from "zod";

import { useToast } from "@quri/ui";

import {
  API_ERROR_CODES,
  type PatchStateRequest,
  type SettingsResponse,
} from "../../shared/api.js";
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
import { api, ApiError } from "./api.js";
import { reportBusy } from "./idle.js";
import {
  LEGACY_KEYS,
  readLegacyFolderState,
  readLegacyFollowChanges,
  readLegacyViewIds,
  readStorage,
  readStorageRecord,
  storageKeys,
  writeStorage,
} from "./storage.js";

// localStorage keys of the first-paint cache (the store in "local" mode).
const GLOBAL_KEY = "squiggle-studio:state:global";
const SETTINGS_KEY = "squiggle-studio:settings";
const ROOT_KEY_PREFIX = "squiggle-studio:state:root:";
const rootKey = (root: string) => `${ROOT_KEY_PREFIX}${root}`;

const WRITE_DEBOUNCE_MS = 300;
const RESYNC_DEBOUNCE_MS = 250;
const BUSY_KEY = "studio-state";

// Root-state keys the one-time migration writes (§7); the packages that own
// each value read and write them under these names.
export const ROOT_STATE_KEYS = {
  activeFile: "activeFile", // string: the shown file (WP4)
  mru: "mru", // string[]: recent files, most recent first, ≤ 20 (WP4)
  viewIds: "viewIds", // Record<path, view id> (WP4)
  relativeValues: "rv", // Record<path, {variable?, tab?}> (WP6)
  migratedAt: "migratedAt", // number: when legacy localStorage was migrated
} as const;

// Global-state keys the migration writes (see stores/layout.ts).
const LAYOUT_KEYS = {
  codePane: "layout.codePane",
  sidebarWidth: "layout.sidebarWidth",
  outputLayout: "layout.outputLayout",
} as const;

const MRU_LIMIT = 20;

// "pending": no answer from the server yet. "server": the server's state
// and settings routes answer. "local": they don't exist or are refused, so
// localStorage is the store. "memory": embed mode, nothing is persisted.
type Backend = "pending" | "server" | "local" | "memory";

let backend: Backend = "pending";
let initialized = false;
let globalState: Record<string, unknown> = {};
let pendingGlobal: Record<string, unknown> = {};
const rootStates = new Map<string, Record<string, unknown>>(); // loaded
const cachedRoots = new Map<string, Record<string, unknown>>(); // first paint
const pendingRoots = new Map<string, Record<string, unknown>>();
let settings: StudioSettings = { ...DEFAULT_SETTINGS };
// Keys present in settings.json (the migration doesn't override them).
let settingsFileKeys = new Set<string>();
// Changes made while settings.json doesn't parse: kept for this page only.
let sessionSettings: Partial<StudioSettings> = {};
let settingsInfo: SettingsFileInfo = { invalidKeys: [] };
let settingsWrites = 0; // PUT /api/settings requests in flight
let writeTimer: ReturnType<typeof setTimeout> | undefined;
let resyncTimer: ReturnType<typeof setTimeout> | undefined;
let flushing: Promise<void> = Promise.resolve();
let configPublisher: number | undefined;
let warnedUnreachable = false;
const listeners = new Set<() => void>();
const lastCached = new Map<string, string>();

export type SettingsFileInfo = {
  path?: string; // absolute path of settings.json (server only)
  error?: string; // settings.json doesn't parse; defaults are in use
  invalidKeys: SettingKey[]; // keys whose values are invalid; defaults used
};

export type StudioStateWarning = { id: number; text: string };
let warnings: StudioStateWarning[] = [];
let warningSeq = 0;
let toastedUpTo = 0;

function notify() {
  for (const cb of [...listeners]) cb();
}

function warn(text: string) {
  if (warnings[warnings.length - 1]?.text === text) return;
  console.warn(`Squiggle Studio: ${text}`);
  warnings = [...warnings.slice(-9), { id: ++warningSeq, text }];
  notify();
}

function readCache(key: string): Record<string, unknown> {
  return readStorageRecord(key);
}

// Writes the cache only when the value changed, so that tabs of one origin
// don't bounce storage events back and forth.
function writeCache(key: string, value: Record<string, unknown>) {
  if (backend === "memory") return;
  const json = JSON.stringify(value);
  if (lastCached.get(key) === json) return;
  lastCached.set(key, json);
  writeStorage(key, value);
}

function publishConfig() {
  configPublisher ??= createContextPublisher();
  const keys: Record<string, unknown> = {};
  for (const key of SETTING_KEYS) keys[`config.${key}`] = settings[key];
  patchContextKeys(configPublisher, keys);
}

function isEmbed(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("embed") === "1";
  } catch {
    return false;
  }
}

// 404 (a server without the routes) and 403 (network mode) mean "use
// localStorage"; anything else (the server is down) is temporary.
function isUnsupported(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 403 || e.status === 404);
}

function unreachable(e: unknown) {
  if (warnedUnreachable) return;
  warnedUnreachable = true;
  console.warn(
    "Squiggle Studio: couldn't reach the server for settings and UI state; using the cached copy.",
    e
  );
}

function ensureInitialized() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  if (isEmbed()) {
    backend = "memory";
    publishConfig();
    return;
  }
  globalState = readCache(GLOBAL_KEY);
  settings = parseSettings(readCache(SETTINGS_KEY)).settings;
  publishConfig();
  window.addEventListener("pagehide", () => {
    void flushStudioState({ keepalive: true });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") scheduleResync();
    else void flushStudioState({ keepalive: true });
  });
  window.addEventListener("focus", scheduleResync);
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) scheduleResync();
  });
  window.addEventListener("storage", onStorage);
  void initialSync();
}

async function initialSync() {
  reportBusy(BUSY_KEY, true);
  try {
    await syncSettings();
    await syncGlobal(true);
  } finally {
    reportBusy(BUSY_KEY, false);
  }
}

// Another tab of this origin wrote the cache.
function onStorage(e: StorageEvent) {
  if (backend === "server" || backend === "pending") {
    if (e.key?.startsWith("squiggle-studio:")) scheduleResync();
    return;
  }
  if (e.key === GLOBAL_KEY) {
    globalState = { ...readCache(GLOBAL_KEY), ...pendingGlobal };
  } else if (e.key === SETTINGS_KEY) {
    applyLocalSettings();
  } else if (e.key?.startsWith(ROOT_KEY_PREFIX)) {
    const root = e.key.slice(ROOT_KEY_PREFIX.length);
    if (rootStates.has(root)) {
      rootStates.set(root, {
        ...readCache(e.key),
        ...(pendingRoots.get(root) ?? {}),
      });
    }
  } else return;
  notify();
}

function scheduleResync() {
  if (backend === "local" || backend === "memory") return;
  if (resyncTimer) clearTimeout(resyncTimer);
  resyncTimer = setTimeout(() => {
    resyncTimer = undefined;
    void resync();
  }, RESYNC_DEBOUNCE_MS);
}

// Pushes pending writes, then re-reads settings and global state.
async function resync() {
  await flushStudioState();
  await syncSettings();
  await syncGlobal(false);
}

function switchToLocal() {
  if (backend === "local" || backend === "memory") return;
  backend = "local";
  if (Object.keys(readCache(GLOBAL_KEY)).length === 0) {
    const migrated = migrateLegacyGlobal();
    if (migrated) globalState = { ...migrated, ...globalState };
  }
  applyLocalSettings();
  persistLocally();
}

// "local" mode: the caches are the store.
function persistLocally() {
  writeCache(GLOBAL_KEY, globalState);
  for (const root of pendingRoots.keys()) {
    const slice = rootStates.get(root);
    if (slice) writeCache(rootKey(root), slice);
  }
  pendingGlobal = {};
  pendingRoots.clear();
}

// ── Server sync ────────────────────────────────────────────────────────────

async function syncGlobal(migrate: boolean) {
  if (backend === "local" || backend === "memory") return;
  let server: Record<string, unknown>;
  try {
    server = (await api.getState("")).global;
  } catch (e) {
    if (isUnsupported(e)) switchToLocal();
    else unreachable(e);
    notify();
    return;
  }
  backend = "server";
  if (migrate && Object.keys(server).length === 0) {
    const migrated = migrateLegacyGlobal();
    if (migrated) {
      pendingGlobal = { ...migrated, ...pendingGlobal };
      scheduleFlush();
    }
  }
  globalState = { ...server, ...pendingGlobal };
  writeCache(GLOBAL_KEY, globalState);
  notify();
}

async function syncSettings() {
  if (backend === "local" || backend === "memory") return;
  let response: SettingsResponse;
  try {
    response = await api.getSettings();
  } catch (e) {
    if (isUnsupported(e)) switchToLocal();
    else unreachable(e);
    notify();
    return;
  }
  backend = "server";
  applySettingsResponse(response);
}

function sameSettings(a: StudioSettings, b: StudioSettings): boolean {
  return SETTING_KEYS.every((k) => Object.is(a[k], b[k]));
}

function applySettingsResponse(response: SettingsResponse) {
  // A PUT in flight answers with a newer file.
  if (settingsWrites > 0) return;
  const parsed = parseSettings(response.error ? {} : response.settings);
  settingsFileKeys = new Set(Object.keys(response.settings));
  if (response.error) {
    if (response.error !== settingsInfo.error) {
      warn(
        `${response.error}. Studio uses the default settings until it's fixed.`
      );
    }
  } else {
    sessionSettings = {};
    const invalid = parsed.invalidKeys.join(", ");
    if (invalid && invalid !== settingsInfo.invalidKeys.join(", ")) {
      warn(
        `Invalid values in ${response.path} for ${invalid}; Studio uses the defaults for ${parsed.invalidKeys.length === 1 ? "it" : "them"}.`
      );
    }
  }
  settingsInfo = {
    path: response.path,
    error: response.error,
    invalidKeys: parsed.invalidKeys,
  };
  const next = { ...parsed.settings, ...sessionSettings };
  if (!sameSettings(settings, next)) {
    settings = next;
    publishConfig();
  }
  writeCache(SETTINGS_KEY, settings);
  notify();
}

function applyLocalSettings() {
  const parsed = parseSettings(readCache(SETTINGS_KEY)).settings;
  if (!sameSettings(settings, parsed)) {
    settings = parsed;
    publishConfig();
  }
}

function scheduleFlush() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    writeTimer = undefined;
    void flushStudioState();
  }, WRITE_DEBOUNCE_MS);
}

function hasPending(): boolean {
  return Object.keys(pendingGlobal).length > 0 || pendingRoots.size > 0;
}

// The requests for everything pending: global keys travel with the first
// root (PATCH takes one root per request).
function pendingRequests(): PatchStateRequest[] {
  const requests: PatchStateRequest[] = [];
  const global = Object.keys(pendingGlobal).length
    ? { ...pendingGlobal }
    : undefined;
  for (const [path, patch] of pendingRoots) {
    requests.push({ root: { path, patch: { ...patch } } });
  }
  if (global) {
    if (requests[0]) requests[0] = { ...requests[0], global };
    else requests.push({ global });
  }
  return requests;
}

// Drops what the server now has, unless it changed again meanwhile.
function acknowledge(request: PatchStateRequest) {
  for (const [key, value] of Object.entries(request.global ?? {})) {
    if (Object.is(pendingGlobal[key], value)) delete pendingGlobal[key];
  }
  if (request.root) {
    const pending = pendingRoots.get(request.root.path);
    if (!pending) return;
    for (const [key, value] of Object.entries(request.root.patch)) {
      if (Object.is(pending[key], value)) delete pending[key];
    }
    if (Object.keys(pending).length === 0) {
      pendingRoots.delete(request.root.path);
    }
  }
}

async function sendPending(keepalive: boolean) {
  if (backend === "memory") {
    pendingGlobal = {};
    pendingRoots.clear();
    return;
  }
  if (backend === "local") {
    persistLocally();
    return;
  }
  for (const request of pendingRequests()) {
    try {
      await api.patchState(request, { keepalive });
    } catch (e) {
      if (isUnsupported(e)) {
        switchToLocal();
        return;
      }
      // The server is down: keep everything pending for the next flush.
      unreachable(e);
      return;
    }
    backend = "server";
    acknowledge(request);
  }
}

// Writes pending changes now (also on pagehide, with keepalive). Flushes run
// one after another, so an older write never lands after a newer one.
export function flushStudioState(
  opts: { keepalive?: boolean } = {}
): Promise<void> {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = undefined;
  if (!hasPending()) return flushing;
  if (opts.keepalive) {
    // The page may be gone before an earlier flush finishes: send now.
    return sendPending(true);
  }
  flushing = flushing.then(() => sendPending(false));
  return flushing;
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

// PATCH merges per key, so a write before the server's copy has arrived
// never clobbers other keys.
export function setGlobalState(key: string, value: unknown): void {
  ensureInitialized();
  if (Object.is(globalState[key], value)) return;
  globalState = { ...globalState, [key]: value };
  pendingGlobal = { ...pendingGlobal, [key]: value };
  scheduleFlush();
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

// The loaded slice, or (before it has loaded) this origin's cached copy.
function readableSlice(root: string): Record<string, unknown> | undefined {
  const loaded = rootStates.get(root);
  if (loaded) return loaded;
  if (backend === "memory" || typeof window === "undefined") return undefined;
  let cached = cachedRoots.get(root);
  if (!cached) {
    cached = readCache(rootKey(root));
    cachedRoots.set(root, cached);
  }
  return cached;
}

function setLoadedRoot(
  root: string,
  slice: Record<string, unknown>
): Record<string, unknown> {
  rootStates.set(root, slice);
  cachedRoots.delete(root);
  writeCache(rootKey(root), slice);
  notify();
  return slice;
}

// Loads a root's slice from the server (resetForRoot awaits it before
// reading or writing). Every call re-reads it, so reopening a folder picks
// up what other windows wrote. The first load of a root whose slice is
// empty migrates the legacy per-origin keys (§7).
export async function loadRootState(
  root: string
): Promise<Record<string, unknown>> {
  ensureInitialized();
  if (backend === "memory") {
    return setLoadedRoot(root, rootStates.get(root) ?? {});
  }
  const busyKey = `${BUSY_KEY}:${root}`;
  reportBusy(busyKey, true);
  try {
    if (backend !== "local") {
      try {
        const response = await api.getState(root);
        backend = "server";
        if (Object.keys(response.root).length === 0 && !rootStates.has(root)) {
          const migrated = migrateLegacyRoot(root);
          if (migrated) {
            pendingRoots.set(root, {
              ...migrated,
              ...(pendingRoots.get(root) ?? {}),
            });
            scheduleFlush();
          }
        }
        return setLoadedRoot(root, {
          ...response.root,
          ...(pendingRoots.get(root) ?? {}),
        });
      } catch (e) {
        if (!isUnsupported(e)) {
          unreachable(e);
          return setLoadedRoot(root, readableSlice(root) ?? {});
        }
        switchToLocal();
      }
    }
    let slice = rootStates.get(root) ?? readCache(rootKey(root));
    if (Object.keys(slice).length === 0) {
      slice = migrateLegacyRoot(root) ?? {};
    }
    return setLoadedRoot(root, slice);
  } finally {
    reportBusy(busyKey, false);
  }
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
  ensureInitialized();
  return parseOr(readableSlice(root)?.[key], schema, fallback);
}

// Ignored (with a warning) before the root's slice has loaded, so that a
// fresh page never overwrites saved state (#4).
export function setRootState(root: string, key: string, value: unknown): void {
  ensureInitialized();
  const slice = rootStates.get(root);
  if (!slice) {
    console.warn(`studioState: ${root} isn't loaded yet; not saving "${key}"`);
    return;
  }
  if (Object.is(slice[key], value)) return;
  rootStates.set(root, { ...slice, [key]: value });
  pendingRoots.set(root, { ...(pendingRoots.get(root) ?? {}), [key]: value });
  scheduleFlush();
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
    () => (root === undefined ? undefined : readableSlice(root)?.[key]),
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

// Where settings.json is, and whether it parses (shortcut sheet, warnings).
export function getSettingsFileInfo(): SettingsFileInfo {
  ensureInitialized();
  return settingsInfo;
}

export function useSettingsFileInfo(): SettingsFileInfo {
  ensureInitialized();
  return useSyncExternalStore(
    subscribeStudioState,
    () => settingsInfo,
    () => settingsInfo
  );
}

// Applies `patch` at once and writes it to settings.json. Never rejects:
// when settings.json doesn't parse, the change applies to this page only;
// when the write fails otherwise, it is undone. Both raise a warning (see
// useSettingsWarningToast).
export async function updateSettings(
  patch: Partial<StudioSettings>
): Promise<void> {
  ensureInitialized();
  const previous = settings;
  settings = parseSettings({ ...settings, ...patch }).settings;
  publishConfig();
  notify();
  if (backend === "memory") return;
  if (backend === "local") {
    writeCache(SETTINGS_KEY, settings);
    return;
  }
  settingsWrites++;
  let response: SettingsResponse;
  try {
    response = await api.putSettings(patch);
  } catch (e) {
    settingsWrites--;
    if (e instanceof ApiError && e.code === API_ERROR_CODES.settingsInvalid) {
      sessionSettings = { ...sessionSettings, ...patch };
      warn(`${e.message} Until then, the change applies to this window only.`);
      return;
    }
    if (isUnsupported(e)) {
      switchToLocal();
      settings = parseSettings({ ...settings, ...patch }).settings;
      writeCache(SETTINGS_KEY, settings);
      publishConfig();
      notify();
      return;
    }
    settings = previous;
    publishConfig();
    notify();
    warn(
      `Couldn't save settings: ${e instanceof Error ? e.message : String(e)}`
    );
    return;
  }
  settingsWrites--;
  backend = "server";
  applySettingsResponse(response);
}

// Re-reads the settings (on the server's `settings-changed` event, or another
// tab's write).
export function handleSettingsChanged(): void {
  ensureInitialized();
  if (backend === "local") {
    applyLocalSettings();
    notify();
    return;
  }
  void syncSettings();
}

// ── Warnings ───────────────────────────────────────────────────────────────

export function useStudioStateWarnings(): readonly StudioStateWarning[] {
  ensureInitialized();
  return useSyncExternalStore(
    subscribeStudioState,
    () => warnings,
    () => warnings
  );
}

// Shows each settings warning (settings.json doesn't parse, invalid values,
// a failed write) once as an error toast. Mount once, inside WithToasts.
export function useSettingsWarningToast(): void {
  const toast = useToast();
  const list = useStudioStateWarnings();
  useEffect(() => {
    for (const warning of list) {
      if (warning.id <= toastedUpTo) continue;
      toastedUpTo = warning.id;
      toast(warning.text, "error");
    }
  }, [list, toast]);
}

// ── Migration of the legacy per-origin keys (§7) ──────────────────────────

const legacyCodePaneSchema = z.object({
  open: z.boolean(),
  fraction: z.number().min(0).max(1),
});
const legacyRvSchema = z.object({
  variable: z.string().optional(),
  tab: z.enum(["list", "grid", "plot"]).optional(),
});

// Global keys, once the server's global state is empty. Follow changes
// becomes the `squiggle.followChanges` setting unless settings.json has it.
function migrateLegacyGlobal(): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {};
  const codePane = readStorage(LEGACY_KEYS.codePane, legacyCodePaneSchema);
  if (codePane) out[LAYOUT_KEYS.codePane] = codePane;
  const width = readStorage(LEGACY_KEYS.sidebarWidth, z.number().finite());
  if (width !== undefined) out[LAYOUT_KEYS.sidebarWidth] = width;
  const outputLayout = readStorage(
    LEGACY_KEYS.outputLayout,
    z.enum(["cards", "list"])
  );
  if (outputLayout) out[LAYOUT_KEYS.outputLayout] = outputLayout;

  const follow = readLegacyFollowChanges();
  if (
    follow === true &&
    !settingsFileKeys.has("squiggle.followChanges") &&
    !settingsInfo.error &&
    !settings["squiggle.followChanges"]
  ) {
    void updateSettings({ "squiggle.followChanges": true });
  }

  if (Object.keys(out).length === 0) return undefined;
  return { ...out, [ROOT_STATE_KEYS.migratedAt]: Date.now() };
}

// A root's keys, once its slice on the server is empty: the open files
// become the MRU (the active one first, and it stays active), then the view
// per file and the relative values view state per file (keyed by path only
// at HEAD, so every root gets them).
function migrateLegacyRoot(root: string): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {};
  const folder = readLegacyFolderState(root);
  if (folder) {
    const mru = [
      ...new Set([
        ...(folder.activeFile ? [folder.activeFile] : []),
        ...folder.openFiles,
        ...folder.recentFiles,
      ]),
    ].slice(0, MRU_LIMIT);
    if (mru.length) out[ROOT_STATE_KEYS.mru] = mru;
    if (folder.activeFile) out[ROOT_STATE_KEYS.activeFile] = folder.activeFile;
  }
  const views = readLegacyViewIds(root);
  if (views && Object.keys(views).length) out[ROOT_STATE_KEYS.viewIds] = views;
  const rv: Record<string, unknown> = {};
  for (const key of storageKeys(LEGACY_KEYS.relativeValuesPrefix)) {
    const value = readStorage(key, legacyRvSchema);
    if (value && Object.keys(value).length) {
      rv[key.slice(LEGACY_KEYS.relativeValuesPrefix.length)] = value;
    }
  }
  if (Object.keys(rv).length) out[ROOT_STATE_KEYS.relativeValues] = rv;
  if (Object.keys(out).length === 0) return undefined;
  return { ...out, [ROOT_STATE_KEYS.migratedAt]: Date.now() };
}

// Publish defaults right away, so `config.*` keys exist before first render.
ensureInitialized();
