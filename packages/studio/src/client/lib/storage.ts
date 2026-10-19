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

const folderStateSchema = z.object({
  openFiles: z.array(z.string()),
  activeFile: z.string().nullable(),
  recentFiles: z.array(z.string()),
});
export type FolderState = z.infer<typeof folderStateSchema>;

const folderKey = (root: string) => `squiggle-studio:folder:${root}`;

export function loadFolderState(root: string): FolderState {
  return (
    readStorage(folderKey(root), folderStateSchema) ?? {
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

export function loadViewIds(root: string): Record<string, string> {
  return readStorage(viewsKey(root), viewsSchema) ?? {};
}

export function saveViewIds(root: string, views: Record<string, string>) {
  writeStorage(viewsKey(root), views);
}

const followKey = "squiggle-studio:follow-changes";

export function loadFollowChanges(): boolean {
  return readStorage(followKey, z.boolean()) ?? false;
}

export function saveFollowChanges(follow: boolean): void {
  writeStorage(followKey, follow);
}
