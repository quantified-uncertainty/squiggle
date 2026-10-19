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

const viewKey = "squiggle-studio:view";

export function loadViewId(): string | undefined {
  return readStorage(viewKey, z.string());
}

export function saveViewId(id: string): void {
  writeStorage(viewKey, id);
}
