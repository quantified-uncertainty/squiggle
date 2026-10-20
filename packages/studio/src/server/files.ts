import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import {
  API_ERROR_CODES,
  type DiskState,
  HASH_LENGTH,
  type TreeNode,
  VISIBLE_EXTENSIONS,
} from "../shared/api.js";
import {
  canonicalPath,
  isErrno,
  isHiddenSegment,
  isIgnoredSegment,
  PathError,
  realRootOf,
  resolveSafePath,
  rootMissingError,
  toApiPath,
} from "./paths.js";

// Hard limits that keep the UI responsive in huge folders (opening `~` must
// not walk all of ~/Library, #4).
export const MAX_TREE_ENTRIES = 5000;
export const MAX_TREE_DIRS = 2000;

// Files above this size get no hash (the watcher would otherwise read them
// on every change); "" means "unknown" in API responses.
export const MAX_HASH_BYTES = 5 * 1024 * 1024;

// sha256 of the content, hex, first 32 characters (§2.6). The client never
// computes hashes; agents compare `<html data-studio-disk-hash>` with this.
export function hashContent(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex").slice(0, HASH_LENGTH);
}

export function isVisibleFile(name: string): boolean {
  return VISIBLE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function isIgnoredPath(apiPath: string): boolean {
  return apiPath
    .split("/")
    .some((s) => isIgnoredSegment(s) || isHiddenSegment(s));
}

// ── Per-path write queue ───────────────────────────────────────────────────

const queues = new Map<string, Promise<void>>();

// Runs `fn` after every earlier call for the same key has settled. Keys are
// absolute paths, lowercased so that case variants of one file on a
// case-insensitive filesystem share a queue. Module-level, so the several
// servers of one Electron process share it.
export function serialize<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const k = key.toLowerCase();
  const previous = queues.get(k) ?? Promise.resolve();
  const run = previous.then(fn);
  const settled = run.then(
    () => undefined,
    () => undefined
  );
  queues.set(k, settled);
  void settled.then(() => {
    if (queues.get(k) === settled) queues.delete(k);
  });
  return run;
}

// The queue key of a canonical API path.
function queueKey(root: string, apiPath: string): string {
  return path.resolve(root, ...apiPath.split("/"));
}

function serializeAll<T>(keys: string[], fn: () => Promise<T>): Promise<T> {
  // A fixed order, so that two calls holding overlapping keys can't wait on
  // each other.
  const sorted = [...new Set(keys.map((k) => k.toLowerCase()))].sort();
  return sorted.reduceRight<() => Promise<T>>(
    (inner, key) => () => serialize(key, inner),
    fn
  )();
}

// Writes `content` to `target` atomically: a uniquely named temp file next to
// it (opened exclusively), then a rename, so readers (watchers, agents) never
// see a half-written file. `beforeRename` runs between the two, and can still
// refuse the write. The temp file never outlives a failure (#7).
export async function atomicWrite(
  target: string,
  content: string,
  beforeRename?: () => Promise<void>
): Promise<void> {
  const tmp = `${target}.${process.pid}.${randomUUID()}.tmp`;
  let renamed = false;
  try {
    await fs.writeFile(tmp, content, { encoding: "utf-8", flag: "wx" });
    await beforeRename?.();
    await fs.rename(tmp, target);
    renamed = true;
  } finally {
    if (!renamed) await fs.rm(tmp, { force: true });
  }
}

// ── Tree ───────────────────────────────────────────────────────────────────

export type TreeScan = {
  tree: TreeNode[];
  truncated: boolean; // MAX_TREE_ENTRIES files or MAX_TREE_DIRS folders hit
  skipped: string[]; // root-relative folders that couldn't be read (#4)
  files: string[]; // every visible file, root-relative
  dirs: string[]; // every folder walked (also empty ones), root-relative
};

// Lists visible files under root. Folders without visible files are omitted
// from `tree`; dot-folders and IGNORED_DIRS are skipped. A subfolder that
// can't be read (EACCES, EPERM) is reported in `skipped` instead of failing
// the whole tree, and one that vanished meanwhile is left out (#4). Only a
// failure on the root itself is an error: 410 "root-missing" or 403.
export async function scanTree(root: string): Promise<TreeScan> {
  const absRoot = path.resolve(root);
  const files: string[] = [];
  const dirs: string[] = [];
  const skipped: string[] = [];
  let truncated = false;
  let dirCount = 0;

  async function walk(dir: string): Promise<TreeNode[]> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (e) {
      if (dir === absRoot) {
        if (isErrno(e, "ENOENT", "ENOTDIR")) throw rootMissingError();
        if (isErrno(e, "EACCES", "EPERM")) {
          throw new PathError(
            `Studio can't read the open folder ${absRoot}: permission denied`,
            403
          );
        }
        throw e;
      }
      if (isErrno(e, "EACCES", "EPERM")) {
        skipped.push(toApiPath(absRoot, dir));
        return [];
      }
      if (isErrno(e, "ENOENT", "ENOTDIR")) return []; // vanished meanwhile
      throw e;
    }
    entries.sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    const result: TreeNode[] = [];
    for (const entry of entries) {
      if (files.length >= MAX_TREE_ENTRIES) {
        truncated = true;
        break;
      }
      if (entry.name.startsWith(".")) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (isIgnoredSegment(entry.name)) continue;
        if (dirCount >= MAX_TREE_DIRS) {
          truncated = true;
          continue;
        }
        dirCount++;
        const rel = toApiPath(absRoot, abs);
        dirs.push(rel);
        const children = await walk(abs);
        if (children.length) {
          result.push({ type: "dir", name: entry.name, path: rel, children });
        }
      } else if (entry.isFile() && isVisibleFile(entry.name)) {
        const rel = toApiPath(absRoot, abs);
        files.push(rel);
        result.push({ type: "file", name: entry.name, path: rel });
      }
    }
    return result;
  }

  const tree = await walk(absRoot);
  return { tree, truncated, skipped, files, dirs };
}

// GET /api/tree's body.
export async function listTree(root: string) {
  const { tree, truncated, skipped } = await scanTree(root);
  return { tree, truncated, skipped };
}

// ── Files ──────────────────────────────────────────────────────────────────

// Resolves an API path that must name a visible (.squiggle/.json/.md) file.
// Through a symlink, the real target must be a visible file too.
async function resolveVisibleFile(
  root: string,
  apiPath: string,
  verb: string // for the error message, e.g. "read"
): Promise<string> {
  const abs = await resolveSafePath(root, apiPath);
  const notVisible = () =>
    new PathError(`Only ${VISIBLE_EXTENSIONS.join(", ")} files can be ${verb}`);
  if (!isVisibleFile(path.basename(abs))) throw notVisible();
  const real = await fs.realpath(abs).catch(() => undefined);
  if (real && !isVisibleFile(path.basename(real))) throw notVisible();
  return abs;
}

// A write the filesystem refused for a reason the user can fix (a read-only
// file, folder or volume, a full disk), as a PathError that names only the
// root-relative path, so the client can say why (`what`, e.g. "write
// a.squiggle"). Anything else is returned as is, to be logged and answered
// generically.
function writeRefused(e: unknown, what: string): unknown {
  if (isErrno(e, "EACCES", "EPERM")) {
    return new PathError(`Studio can't ${what}: permission denied`, 403);
  }
  if (isErrno(e, "EROFS")) {
    return new PathError(`Studio can't ${what}: the disk is read-only`, 403);
  }
  if (isErrno(e, "ENOSPC", "EDQUOT")) {
    return new PathError(`Studio can't ${what}: the disk is full`, 507);
  }
  return e;
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

// Where a write to `abs` goes: an in-root symlink is written through to its
// target, keeping the link (#37; resolveSafePath already checked that the
// target is inside the root). A dangling link is replaced, never followed.
async function writeTarget(abs: string): Promise<string> {
  const stat = await fs.lstat(abs).catch(() => undefined);
  if (!stat?.isSymbolicLink()) return abs;
  return fs.realpath(abs).catch(() => abs);
}

// The current content and hash of a file, for 409 "disk-changed".
async function diskState(abs: string): Promise<DiskState> {
  let data: Buffer;
  try {
    data = await fs.readFile(abs);
  } catch (e) {
    if (isErrno(e, "ENOENT", "ENOTDIR", "EISDIR")) return { exists: false };
    throw e;
  }
  return {
    exists: true,
    content: data.toString("utf-8"),
    hash: hashContent(data),
  };
}

// The hash of a file, "" when it is too big to hash, undefined when it isn't
// a readable file.
export async function hashFile(abs: string): Promise<string | undefined> {
  let stat;
  try {
    stat = await fs.stat(abs);
  } catch {
    return undefined;
  }
  if (!stat.isFile()) return undefined;
  if (stat.size > MAX_HASH_BYTES) return "";
  try {
    return hashContent(await fs.readFile(abs));
  } catch {
    return undefined;
  }
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
  const data = await fs.readFile(abs);
  return {
    path: toApiPath(path.resolve(root), abs), // canonical
    content: data.toString("utf-8"),
    mtimeMs: stat.mtimeMs,
    hash: data.length > MAX_HASH_BYTES ? "" : hashContent(data),
  };
}

export type WriteOptions = {
  // false: fail with 409 "file-exists" if the file exists (create).
  overwrite?: boolean;
  // The hash the client last read; the write is refused with 409
  // "disk-changed" (and the disk's current state) if the file on disk has
  // another hash or is gone (#5). Checked right before the rename.
  baseHash?: string;
  // Checked right before the rename too: the Hub import's request was
  // aborted (#49), so nothing may be written.
  signal?: AbortSignal;
};

// Writes atomically, serialized per file, through in-root symlinks. `apiPath`
// must be canonical (400 "non-canonical-path" otherwise, #8).
export async function writeFile(
  root: string,
  apiPath: string,
  content: string,
  options: WriteOptions = {}
) {
  const canonical = canonicalPath(apiPath);
  // Queued under the path as named, synchronously, so writes land in the
  // order they arrived.
  return serialize(queueKey(root, canonical), async () => {
    const abs = await resolveVisibleFile(root, canonical, "written");
    const target = await writeTarget(abs);
    const stat = await fs.stat(target).catch(() => undefined);
    if (stat && !stat.isFile()) {
      throw new PathError(`Not a file: ${canonical}`);
    }
    if (options.overwrite === false && (await lexists(abs))) {
      throw fileExistsError(canonical);
    }
    await realRootOf(root); // never recreate a deleted root below
    try {
      await fs.mkdir(path.dirname(target), { recursive: true });
      await atomicWrite(target, content, async () => {
        options.signal?.throwIfAborted();
        if (options.baseHash !== undefined) {
          const current = await diskState(target);
          if (current.hash !== options.baseHash) {
            throw new PathError(
              current.exists
                ? `${canonical} changed on disk since it was read`
                : `${canonical} was deleted on disk since it was read`,
              409,
              API_ERROR_CODES.diskChanged,
              { current }
            );
          }
        }
        if (options.overwrite === false && (await lexists(abs))) {
          throw fileExistsError(canonical);
        }
      });
    } catch (e) {
      throw writeRefused(e, `write ${canonical}`);
    }
    const written = await fs.stat(target);
    return {
      path: canonical,
      mtimeMs: written.mtimeMs,
      hash: hashContent(content),
    };
  });
}

// Renames or moves a file inside root. `to` must not exist; its parent
// directories are created. Both paths must be canonical (#8).
export async function renameFile(root: string, from: string, to: string) {
  const fromPath = canonicalPath(from);
  const toPath = canonicalPath(to);
  const keys = [queueKey(root, fromPath), queueKey(root, toPath)];
  return serializeAll(keys, async () => {
    const fromAbs = await resolveVisibleFile(root, fromPath, "renamed");
    const toAbs = await resolveVisibleFile(root, toPath, "renamed");
    let fromStat;
    try {
      fromStat = await fs.stat(fromAbs);
    } catch {
      throw new PathError(`File not found: ${fromPath}`, 404);
    }
    if (!fromStat.isFile()) {
      throw new PathError(`Not a file: ${fromPath}`);
    }
    if (await lexists(toAbs)) {
      // On case-insensitive filesystems `a.squiggle` -> `A.squiggle` finds
      // the source itself; that's a valid rename, not a collision.
      const toStat = await fs.stat(toAbs).catch(() => undefined);
      const caseOnly =
        fromAbs !== toAbs &&
        fromAbs.toLowerCase() === toAbs.toLowerCase() &&
        toStat?.ino === fromStat.ino &&
        toStat.dev === fromStat.dev;
      if (!caseOnly) throw fileExistsError(toPath);
    }
    try {
      await fs.mkdir(path.dirname(toAbs), { recursive: true });
      await fs.rename(fromAbs, toAbs);
    } catch (e) {
      throw writeRefused(e, `move ${fromPath} to ${toPath}`);
    }
    const stat = await fs.stat(toAbs);
    return {
      from: fromPath,
      to: toPath,
      mtimeMs: stat.mtimeMs,
      hash: (await hashFile(toAbs)) ?? "",
    };
  });
}

// POST /api/hashes: the hash of each path; null for a missing file, "" for
// one too big to hash. Invalid paths fail the request (400).
export async function hashPaths(
  root: string,
  paths: string[]
): Promise<Record<string, string | null>> {
  const resolved = await Promise.all(
    paths.map((p) => resolveVisibleFile(root, p, "read"))
  );
  const hashes = await Promise.all(resolved.map((abs) => hashFile(abs)));
  const result: Record<string, string | null> = {};
  paths.forEach((p, i) => {
    result[p] = hashes[i] ?? null;
  });
  return result;
}
