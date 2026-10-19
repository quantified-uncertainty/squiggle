import { z } from "zod";

// localStorage can be unavailable (private windows, blocked storage), so all
// access is wrapped and falls back gracefully.

export function readStorage<T>(
  key: string,
  schema: z.ZodType<T>
): T | undefined {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return undefined;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export function writeStorage(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// ── Helpers for studioState's first-paint cache and its migration (§7) ────

const recordSchema = z.record(z.string(), z.unknown());

// A stored JSON object, or {} (missing, invalid, or storage unavailable).
export function readStorageRecord(key: string): Record<string, unknown> {
  return readStorage(key, recordSchema) ?? {};
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// Every stored key starting with `prefix`.
export function storageKeys(prefix: string): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(prefix)) keys.push(key);
    }
    return keys;
  } catch {
    return [];
  }
}

// ── Legacy per-origin state (until integration; see studioState) ──────────

const folderStateSchema = z.object({
  openFiles: z.array(z.string()),
  activeFile: z.string().nullable(),
  recentFiles: z.array(z.string()),
});
export type FolderState = z.infer<typeof folderStateSchema>;

export const LEGACY_FOLDER_PREFIX = "squiggle-studio:folder:";
const folderKey = (root: string) => `${LEGACY_FOLDER_PREFIX}${root}`;

export function readLegacyFolderState(root: string): FolderState | undefined {
  return readStorage(folderKey(root), folderStateSchema);
}

export function loadFolderState(root: string): FolderState {
  return (
    readLegacyFolderState(root) ?? {
      openFiles: [],
      activeFile: null,
      recentFiles: [],
    }
  );
}

export function saveFolderState(root: string, state: FolderState): void {
  writeStorage(folderKey(root), state);
}

// The view (Output, Relative values, Playground) last chosen per file.
const viewsKey = (root: string) => `squiggle-studio:views:${root}`;
const viewsSchema = z.record(z.string(), z.string());

export function readLegacyViewIds(
  root: string
): Record<string, string> | undefined {
  return readStorage(viewsKey(root), viewsSchema);
}

export function loadViewIds(root: string): Record<string, string> {
  return readLegacyViewIds(root) ?? {};
}

export function saveViewIds(root: string, views: Record<string, string>) {
  writeStorage(viewsKey(root), views);
}

const followKey = "squiggle-studio:follow-changes";

export function readLegacyFollowChanges(): boolean | undefined {
  return readStorage(followKey, z.boolean());
}

export function loadFollowChanges(): boolean {
  return readLegacyFollowChanges() ?? false;
}

export function saveFollowChanges(follow: boolean): void {
  writeStorage(followKey, follow);
}

// Keys of other legacy per-origin state, written by CodePane, Explorer,
// OutputView and RelativeValuesView at HEAD (read by the migration).
export const LEGACY_KEYS = {
  codePane: "squiggle-studio:code-pane", // {open, fraction}
  sidebarWidth: "squiggle-studio:sidebar-width", // number
  outputLayout: "squiggle-studio:output-layout", // "cards" | "list"
  relativeValuesPrefix: "squiggle-studio:relative-values:", // + file path
} as const;
