// POSIX path helpers for root-relative API paths ("dir/file.squiggle").
// Shared by the browser client and Node (server, CLI), so imports resolve with
// the same code everywhere. No Node or DOM imports.

import { VISIBLE_EXTENSIONS } from "./api.js";

export function dirname(p: string): string {
  const i = p.lastIndexOf("/");
  return i === -1 ? "" : p.slice(0, i);
}

export function basename(p: string): string {
  return p.slice(p.lastIndexOf("/") + 1);
}

// ".squiggle" for "lib/costs.squiggle"; "" when the last segment has no dot
// or only a leading one ("Makefile", ".env").
export function extname(p: string): string {
  const base = basename(p);
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(dot) : "";
}

// Joins and normalizes; throws if the result would escape the root.
export function joinPath(base: string, rel: string): string {
  const out: string[] = [];
  for (const segment of [...base.split("/"), ...rel.split("/")]) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      if (!out.length) {
        throw new Error(`Import path escapes the open folder: ${rel}`);
      }
      out.pop();
    } else {
      out.push(segment);
    }
  }
  return out.join("/");
}

export type NormalizedPath =
  | { ok: true; path: string }
  | { ok: false; error: string };

export const PATH_MESSAGES = {
  empty: "Enter a file name",
  parent: 'Names can\'t contain ".." segments',
  hidden: 'Names starting with "." are hidden, so Studio doesn\'t show them',
  absolute: "Use a path inside the open folder",
} as const;

// The canonical form of a root-relative path typed by a user or sent by a
// client: `\` becomes `/`, empty and `.` segments are dropped (`./x`, `a//b`,
// `m/./n`). Refuses `..`, hidden (dot) segments, absolute Windows paths and an
// empty last segment ("trail/" or ""). The server rejects non-canonical input
// with 400 `non-canonical-path` naming this form (#8).
export function normalizeRelPath(input: string): NormalizedPath {
  const trimmed = input.trim().replace(/\\/g, "/");
  if (/^[a-zA-Z]:\//.test(trimmed)) {
    return { ok: false, error: PATH_MESSAGES.absolute };
  }
  const segments = trimmed.split("/");
  const last = segments[segments.length - 1];
  if (last === "" || last === ".") {
    return { ok: false, error: PATH_MESSAGES.empty };
  }
  const out: string[] = [];
  for (const segment of segments) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") return { ok: false, error: PATH_MESSAGES.parent };
    if (segment.startsWith(".")) {
      return { ok: false, error: PATH_MESSAGES.hidden };
    }
    out.push(segment);
  }
  if (!out.length) return { ok: false, error: PATH_MESSAGES.empty };
  return { ok: true, path: out.join("/") };
}

// Adds `ext` (default ".squiggle") to a name without an extension. Names that
// already have one are returned unchanged, supported or not; callers refuse
// unsupported extensions with their own message (#39). Rename passes the
// source's extension: `withDefaultExtension(name, extname(from))`.
export function withDefaultExtension(name: string, ext = ".squiggle"): string {
  if (extname(name) !== "") return name;
  return `${name}${ext}`;
}

// True for the file types Studio lists and edits (.squiggle, .json, .md).
export function isSupportedPath(p: string): boolean {
  return VISIBLE_EXTENSIONS.includes(extname(p));
}
