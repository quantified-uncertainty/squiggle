import fs from "node:fs/promises";
import path from "node:path";

import {
  API_ERROR_CODES,
  type TreeNode,
  VISIBLE_EXTENSIONS,
} from "../shared/api.js";
import {
  IGNORED_DIRS,
  PathError,
  resolveSafePath,
  toApiPath,
} from "./paths.js";

// Hard limit to keep the UI responsive in huge folders.
const MAX_TREE_ENTRIES = 5000;

export function isVisibleFile(name: string): boolean {
  return VISIBLE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function isIgnoredPath(apiPath: string): boolean {
  return apiPath
    .split("/")
    .some((s) => IGNORED_DIRS.has(s) || (s.startsWith(".") && s.length > 1));
}

// Lists visible files under root. Directories without visible files are
// omitted, dot-directories and IGNORED_DIRS are skipped.
export async function listTree(root: string): Promise<TreeNode[]> {
  let count = 0;

  async function walk(dir: string): Promise<TreeNode[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    const result: TreeNode[] = [];
    for (const entry of entries) {
      if (count >= MAX_TREE_ENTRIES) break;
      if (entry.name.startsWith(".")) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        const children = await walk(abs);
        if (children.length) {
          result.push({
            type: "dir",
            name: entry.name,
            path: toApiPath(root, abs),
            children,
          });
        }
      } else if (entry.isFile() && isVisibleFile(entry.name)) {
        count++;
        result.push({
          type: "file",
          name: entry.name,
          path: toApiPath(root, abs),
        });
      }
    }
    return result;
  }

  return walk(path.resolve(root));
}

// Resolves an API path that must name a visible (.squiggle/.json/.md) file.
async function resolveVisibleFile(
  root: string,
  apiPath: string,
  verb: string // for the error message, e.g. "read"
): Promise<string> {
  const abs = await resolveSafePath(root, apiPath);
  if (!isVisibleFile(path.basename(abs))) {
    throw new PathError(
      `Only ${VISIBLE_EXTENSIONS.join(", ")} files can be ${verb}`
    );
  }
  return abs;
}

function fileExistsError(apiPath: string): PathError {
  return new PathError(
    `File already exists: ${apiPath}`,
    409,
    API_ERROR_CODES.fileExists
  );
}

// lstat, so that a dangling symlink also counts as existing.
async function lexists(abs: string): Promise<boolean> {
  return fs
    .lstat(abs)
    .then(() => true)
    .catch(() => false);
}

export async function readFile(root: string, apiPath: string) {
  const abs = await resolveVisibleFile(root, apiPath, "read");
  let stat;
  try {
    stat = await fs.stat(abs);
  } catch {
    throw new PathError(`File not found: ${apiPath}`, 404);
  }
  if (!stat.isFile()) {
    throw new PathError(`Not a file: ${apiPath}`);
  }
  const content = await fs.readFile(abs, "utf-8");
  return { path: apiPath, content, mtimeMs: stat.mtimeMs };
}

export async function writeFile(
  root: string,
  apiPath: string,
  content: string,
  options: { overwrite?: boolean } = {}
) {
  const abs = await resolveVisibleFile(root, apiPath, "written");
  if (options.overwrite === false && (await lexists(abs))) {
    throw fileExistsError(apiPath);
  }
  await fs.mkdir(path.dirname(abs), { recursive: true });
  // Write to a temp file and rename, so that watchers (and agents) never
  // observe a half-written file.
  const tmp = `${abs}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, content, "utf-8");
  await fs.rename(tmp, abs);
  const stat = await fs.stat(abs);
  return { path: apiPath, mtimeMs: stat.mtimeMs };
}

// Renames or moves a file inside root. `to` must not exist; its parent
// directories are created.
export async function renameFile(root: string, from: string, to: string) {
  const fromAbs = await resolveVisibleFile(root, from, "renamed");
  const toAbs = await resolveVisibleFile(root, to, "renamed");
  let fromStat;
  try {
    fromStat = await fs.stat(fromAbs);
  } catch {
    throw new PathError(`File not found: ${from}`, 404);
  }
  if (!fromStat.isFile()) {
    throw new PathError(`Not a file: ${from}`);
  }
  if (await lexists(toAbs)) {
    // On case-insensitive filesystems `a.squiggle` -> `A.squiggle` finds the
    // source itself; that's a valid rename, not a collision.
    const toStat = await fs.stat(toAbs).catch(() => undefined);
    const caseOnly =
      fromAbs !== toAbs &&
      fromAbs.toLowerCase() === toAbs.toLowerCase() &&
      toStat?.ino === fromStat.ino &&
      toStat.dev === fromStat.dev;
    if (!caseOnly) throw fileExistsError(to);
  }
  await fs.mkdir(path.dirname(toAbs), { recursive: true });
  await fs.rename(fromAbs, toAbs);
  const stat = await fs.stat(toAbs);
  return { from, to, mtimeMs: stat.mtimeMs };
}
