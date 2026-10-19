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

// ── Legacy per-origin keys, read once by studioState's migration (§7) ──────

const folderStateSchema = z.object({
  openFiles: z.array(z.string()),
  activeFile: z.string().nullable(),
  recentFiles: z.array(z.string()),
});
type FolderState = z.infer<typeof folderStateSchema>;

export function readLegacyFolderState(root: string): FolderState | undefined {
  return readStorage(`squiggle-studio:folder:${root}`, folderStateSchema);
}

// The view (Output, Relative values, Playground) last chosen per file.
export function readLegacyViewIds(
  root: string
): Record<string, string> | undefined {
  return readStorage(
    `squiggle-studio:views:${root}`,
    z.record(z.string(), z.string())
  );
}

export function readLegacyFollowChanges(): boolean | undefined {
  return readStorage("squiggle-studio:follow-changes", z.boolean());
}

// Keys of other legacy per-origin state, written by CodePane, Explorer,
// OutputView and RelativeValuesView before v2.
export const LEGACY_KEYS = {
  codePane: "squiggle-studio:code-pane", // {open, fraction}
  sidebarWidth: "squiggle-studio:sidebar-width", // number
  outputLayout: "squiggle-studio:output-layout", // "cards" | "list"
  relativeValuesPrefix: "squiggle-studio:relative-values:", // + file path
} as const;
