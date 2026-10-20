import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { type RecentFolder, recentFoldersSchema } from "../shared/api.js";
import { atomicWrite, serialize } from "./files.js";

const MAX_RECENT = 15;

export function defaultRecentFile(): string {
  return path.join(os.homedir(), ".squiggle-studio", "recent.json");
}

async function isDirectory(folder: string): Promise<boolean> {
  return fs
    .stat(folder)
    .then((s) => s.isDirectory())
    .catch(() => false);
}

async function readRecentFolders(file: string): Promise<RecentFolder[]> {
  let raw: string;
  try {
    raw = await fs.readFile(file, "utf-8");
  } catch {
    return [];
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return [];
  }
  const parsed = recentFoldersSchema.safeParse(json);
  return parsed.success ? parsed.data : [];
}

// Recently opened folders, most recent first. Folders that no longer exist
// (moved, deleted, an unmounted drive) are left out (#51); the next
// addRecentFolder drops them from the file too.
export async function loadRecentFolders(file: string): Promise<RecentFolder[]> {
  const all = await readRecentFolders(file);
  const exists = await Promise.all(all.map((f) => isDirectory(f.path)));
  return all.filter((_, i) => exists[i]);
}

export async function addRecentFolder(
  file: string,
  folder: string
): Promise<RecentFolder[]> {
  return serialize(file, async () => {
    const existing = await loadRecentFolders(file);
    const updated = [
      { path: folder, openedAt: Date.now() },
      ...existing.filter((f) => f.path !== folder),
    ].slice(0, MAX_RECENT);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await atomicWrite(file, JSON.stringify(updated, null, 2));
    return updated;
  });
}
