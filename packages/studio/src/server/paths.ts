import fs from "node:fs/promises";
import path from "node:path";

import { API_ERROR_CODES, type DiskState } from "../shared/api.js";
import { normalizeRelPath } from "../shared/paths.js";

// Extra fields of an API error body (see apiErrorResponseSchema).
export type ApiErrorDetails = {
  root?: string; // with code "root-changed"
  current?: DiskState; // with code "disk-changed"
  canonical?: string; // with code "non-canonical-path"
};

// An error with an HTTP status, answered as `{error, code, ...details}`.
export class PathError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
    public readonly code?: string, // see API_ERROR_CODES
    public readonly details: ApiErrorDetails = {}
  ) {
    super(message);
  }
}

// Compared lowercased: on case-insensitive filesystems (macOS, Windows)
// `NODE_MODULES/` and `Dist/` are the same folders (#36).
export const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".hg",
  ".svn",
  ".next",
  ".turbo",
  "dist",
]);

export function isIgnoredSegment(segment: string): boolean {
  return IGNORED_DIRS.has(segment.toLowerCase());
}

// "." is fine, ".anything" (".env", ".git", "..") is not.
export function isHiddenSegment(segment: string): boolean {
  return segment.startsWith(".") && segment !== ".";
}

export function rootMissingError(): PathError {
  return new PathError(
    "The open folder was moved or deleted",
    410,
    API_ERROR_CODES.rootMissing
  );
}

function errnoCode(e: unknown): string | undefined {
  return e instanceof Error && "code" in e && typeof e.code === "string"
    ? e.code
    : undefined;
}

export function isErrno(e: unknown, ...codes: string[]): boolean {
  const code = errnoCode(e);
  return code !== undefined && codes.includes(code);
}

function isInside(root: string, target: string): boolean {
  const rel = path.relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function checkSegments(segments: string[], viaSymlink: boolean) {
  const suffix = viaSymlink ? " (through a symlink)" : "";
  if (segments.some(isHiddenSegment)) {
    throw new PathError(`Hidden files and folders are not allowed${suffix}`);
  }
  if (segments.some(isIgnoredSegment)) {
    throw new PathError(`Path is inside an ignored directory${suffix}`);
  }
}

// The open folder's real path; 410 "root-missing" when it is gone (#35).
export async function realRootOf(root: string): Promise<string> {
  try {
    return await fs.realpath(path.resolve(root));
  } catch (e) {
    if (isErrno(e, "ENOENT", "ENOTDIR")) throw rootMissingError();
    throw e;
  }
}

// Resolves an API path (POSIX, relative to `root`) to an absolute filesystem
// path, guaranteeing that the result stays inside `root`.
// Throws PathError for anything suspicious: absolute paths, `..` escapes,
// NUL bytes, hidden (dot) files and directories such as `.env` or `.git`,
// ignored directories, or symlinks that point outside the root. The hidden
// and ignored checks run on the path as given and again on the real path of
// its deepest existing ancestor, so neither letter case (#36) nor an in-root
// symlink can reach `node_modules/` or `.git/`.
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
  checkSegments(segments, false);

  const absRoot = path.resolve(root);
  const target = path.resolve(absRoot, ...segments);
  if (!isInside(absRoot, target)) {
    throw new PathError("Path escapes the root folder");
  }

  // Resolve symlinks for the deepest existing ancestor, so that both existing
  // files and to-be-created files are checked.
  const realRoot = await realRootOf(absRoot);
  let existing = target;
  for (;;) {
    let real: string;
    try {
      real = await fs.realpath(existing);
    } catch {
      const parent = path.dirname(existing);
      if (parent === existing) break;
      existing = parent;
      continue;
    }
    if (!isInside(realRoot, real)) {
      throw new PathError("Path escapes the root folder via a symlink");
    }
    const realRel = path.relative(realRoot, real);
    if (realRel !== "") checkSegments(realRel.split(path.sep), true);
    break;
  }

  return target;
}

// The canonical form of a root-relative path sent by a client, for routes
// that create or move files (PUT /api/file, rename, Hub import). Anything
// else is refused: 400, and for input that only differs in form (`./x`,
// `a//b`, `a\b`, `m/./n`, surrounding spaces) code "non-canonical-path" with
// the canonical form, so a client never keeps a buffer under a path that
// isn't the file's (#8).
export function canonicalPath(input: string): string {
  if (typeof input !== "string" || input === "") {
    throw new PathError("Path is required");
  }
  if (input.includes("\0")) throw new PathError("Invalid path");
  if (/^\s*[/\\]/.test(input) || /^\s*[a-zA-Z]:/.test(input)) {
    throw new PathError("Absolute paths are not allowed");
  }
  const result = normalizeRelPath(input);
  if (!result.ok) throw new PathError(result.error);
  if (result.path !== input) {
    throw new PathError(
      `Use the canonical path "${result.path}" instead of "${input}"`,
      400,
      API_ERROR_CODES.nonCanonicalPath,
      { canonical: result.path }
    );
  }
  return result.path;
}

// Converts an absolute path inside root to an API path.
export function toApiPath(root: string, absPath: string): string {
  return path.relative(root, absPath).split(path.sep).join("/");
}
