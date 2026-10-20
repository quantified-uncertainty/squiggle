import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { BrowseResponse } from "../shared/api.js";
import { isErrno, PathError } from "./paths.js";

// A folder path typed by the user (Open Folder modal, POST /api/root, GET
// /api/browse), resolved the same way everywhere (#19): trimmed; empty is
// refused; `~` and `~/…` expand to the home folder (not `~user`); after that
// the path must be absolute, never relative to the server's working
// directory.
export function resolveUserFolder(
  input: string,
  home: string = os.homedir()
): string {
  const trimmed = input.trim();
  if (trimmed === "") throw new PathError("Enter a folder path");
  if (trimmed.includes("\0")) throw new PathError("Invalid path");
  let expanded = trimmed;
  if (trimmed === "~") expanded = home;
  else if (trimmed.startsWith("~/") || trimmed.startsWith("~\\")) {
    expanded = path.join(home, trimmed.slice(2));
  }
  if (!path.isAbsolute(expanded)) {
    throw new PathError(
      `Use an absolute path (like /Users/me/models or ~/models), not "${trimmed}"`
    );
  }
  return path.resolve(expanded);
}

function permissionDenied(dir: string): PathError {
  return new PathError(`Studio can't read ${dir}: permission denied`, 403);
}

// The absolute path of an existing directory; 400 otherwise, 403 when it
// can't be accessed.
export async function assertDirectory(folder: string): Promise<string> {
  const abs = path.resolve(folder);
  let stat;
  try {
    stat = await fs.stat(abs);
  } catch (e) {
    if (isErrno(e, "EACCES", "EPERM")) throw permissionDenied(abs);
    throw new PathError(`Not a folder: ${abs}`);
  }
  if (!stat.isDirectory()) throw new PathError(`Not a folder: ${abs}`);
  return abs;
}

// GET /api/browse: the folders inside `input` (default: the home folder),
// for the Open Folder modal. Hidden folders are left out; symlinks to
// folders are listed. EACCES and EPERM (e.g. macOS's protected folders) are
// a readable 403, not a raw 500 (#4).
export async function browseFolder(
  input: string | undefined,
  home: string = os.homedir()
): Promise<BrowseResponse> {
  const dir = await assertDirectory(
    input === undefined ? home : resolveUserFolder(input, home)
  );
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (e) {
    if (isErrno(e, "EACCES", "EPERM")) throw permissionDenied(dir);
    throw e;
  }
  const dirs: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) dirs.push(entry.name);
    else if (entry.isSymbolicLink()) {
      const stat = await fs.stat(path.join(dir, entry.name)).catch(() => null);
      if (stat?.isDirectory()) dirs.push(entry.name);
    }
  }
  dirs.sort((a, b) => a.localeCompare(b));
  const parent = path.dirname(dir);
  return { path: dir, parent: parent === dir ? null : parent, dirs };
}
