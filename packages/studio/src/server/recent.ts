import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { type RecentFolder, recentFoldersSchema } from "../shared/api.js";

const MAX_RECENT = 15;

export function defaultRecentFile(): string {
  return path.join(os.homedir(), ".squiggle-studio", "recent.json");
}

export async function loadRecentFolders(file: string): Promise<RecentFolder[]> {
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

export async function addRecentFolder(
  file: string,
  folder: string
): Promise<RecentFolder[]> {
  const existing = await loadRecentFolders(file);
  const updated = [
    { path: folder, openedAt: Date.now() },
    ...existing.filter((f) => f.path !== folder),
  ].slice(0, MAX_RECENT);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(updated, null, 2), "utf-8");
  return updated;
}
