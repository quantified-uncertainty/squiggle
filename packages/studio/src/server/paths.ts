import fs from "node:fs/promises";
import path from "node:path";

export class PathError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400
  ) {
    super(message);
  }
}

export const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".hg",
  ".svn",
  ".next",
  ".turbo",
  "dist",
]);

function isInside(root: string, target: string): boolean {
  const rel = path.relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

// Resolves an API path (POSIX, relative to `root`) to an absolute filesystem
// path, guaranteeing that the result stays inside `root`.
// Throws PathError for anything suspicious: absolute paths, `..` escapes,
// NUL bytes, ignored directories, or symlinks that point outside the root.
export async function resolveSafePath(
  root: string,
  relPath: string
): Promise<string> {
  if (typeof relPath !== "string" || relPath === "") {
    throw new PathError("Path is required");
  }
  if (relPath.includes("\0")) {
    throw new PathError("Invalid path");
  }
  // Normalize Windows separators so that `..\\` can't sneak through.
  const normalized = relPath.replace(/\\/g, "/");
  if (normalized.startsWith("/") || /^[a-zA-Z]:/.test(normalized)) {
    throw new PathError("Absolute paths are not allowed");
  }
  const segments = normalized.split("/");
  if (segments.some((s) => s === "..")) {
    throw new PathError("Path traversal is not allowed");
  }
  if (segments.some((s) => IGNORED_DIRS.has(s))) {
    throw new PathError("Path is inside an ignored directory");
  }

  const absRoot = path.resolve(root);
  const target = path.resolve(absRoot, ...segments);
  if (!isInside(absRoot, target)) {
    throw new PathError("Path escapes the root folder");
  }

  // Resolve symlinks for the deepest existing ancestor, so that both existing
  // files and to-be-created files are checked.
  const realRoot = await fs.realpath(absRoot);
  let existing = target;
  for (;;) {
    try {
      const real = await fs.realpath(existing);
      if (!isInside(realRoot, real)) {
        throw new PathError("Path escapes the root folder via a symlink");
      }
      break;
    } catch (e) {
      if (e instanceof PathError) throw e;
      const parent = path.dirname(existing);
      if (parent === existing) break;
      existing = parent;
    }
  }

  return target;
}

// Converts an absolute path inside root to an API path.
export function toApiPath(root: string, absPath: string): string {
  return path.relative(root, absPath).split(path.sep).join("/");
}
