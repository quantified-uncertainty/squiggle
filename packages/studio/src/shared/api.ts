// Types and schemas shared by the Studio server and client: the HTTP
// contract of §10.4 (Studio v2 spec). Paths exchanged over the API are always
// POSIX-style, canonical (see normalizeRelPath in paths.ts) and relative to
// the currently open root folder (e.g. "models/main.squiggle").
//
// TRANSITIONAL: fields marked "(pre-WP7 default)" are required by the
// contract, but the server at HEAD doesn't send them yet; the schema fills a
// sentinel so the client keeps working until WP7 lands. Integration removes
// these defaults. A "" hash means "unknown".
import { z } from "zod";

export type TreeNode =
  | { type: "file"; name: string; path: string }
  | { type: "dir"; name: string; path: string; children: TreeNode[] };

export const treeNodeSchema: z.ZodType<TreeNode> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("file"), name: z.string(), path: z.string() }),
    z.object({
      type: z.literal("dir"),
      name: z.string(),
      path: z.string(),
      children: z.array(treeNodeSchema),
    }),
  ])
);

// sha256 of a file's content, hex, first 32 characters (computed by the
// server; none for files over 5 MB).
export const HASH_LENGTH = 32;

// GET /api/root, POST /api/root
export const rootInfoSchema = z.object({
  root: z.string(), // absolute path of the open folder
  name: z.string(), // basename of the open folder
  // false in network mode: Open Folder, Open Recent folders and the Explorer
  // header's folder switcher are disabled (#31). (pre-WP7 default)
  allowOpenFolder: z.boolean().default(true),
});
export type RootInfo = z.infer<typeof rootInfoSchema>;

// GET /api/tree. The expected-root header is enforced (409 root-changed).
export const treeResponseSchema = z.object({
  tree: z.array(treeNodeSchema),
  // The 5000-file cap was hit. (pre-WP7 default)
  truncated: z.boolean().default(false),
  // Root-relative folders that couldn't be read (#4). (pre-WP7 default)
  skipped: z.array(z.string()).default([]),
});
export type TreeResponse = z.infer<typeof treeResponseSchema>;

// GET /api/file?path=
export const fileResponseSchema = z.object({
  path: z.string(),
  content: z.string(),
  mtimeMs: z.number(),
  hash: z.string().default(""), // (pre-WP7 default)
});
export type FileResponse = z.infer<typeof fileResponseSchema>;

// PUT /api/file
export const writeFileRequestSchema = z.object({
  path: z.string(),
  content: z.string(),
  create: z.boolean().optional(), // fail with 409 "file-exists" if it exists
  // The hash the client last read. If the file on disk has another hash, the
  // write is refused with 409 "disk-changed" (#5). Omitted: unconditional.
  baseHash: z.string().optional(),
});
export type WriteFileRequest = z.infer<typeof writeFileRequestSchema>;

export const writeFileResponseSchema = z.object({
  path: z.string(), // canonical
  mtimeMs: z.number(),
  hash: z.string().default(""), // (pre-WP7 default)
});
export type WriteFileResponse = z.infer<typeof writeFileResponseSchema>;

// Body of a 409 "disk-changed" response: what is on disk now.
export const diskStateSchema = z.object({
  exists: z.boolean(),
  content: z.string().optional(),
  hash: z.string().optional(),
});
export type DiskState = z.infer<typeof diskStateSchema>;

// POST /api/file/rename
export const renameFileRequestSchema = z.object({
  from: z.string(),
  to: z.string(), // must not exist yet
});

export const renameFileResponseSchema = z.object({
  from: z.string(),
  to: z.string(), // canonical
  hash: z.string().default(""), // (pre-WP7 default)
});
export type RenameFileResponse = z.infer<typeof renameFileResponseSchema>;

// POST /api/hashes: the current hash of each path (null: missing), used to
// resync the working set after a reconnect, focus or pageshow (#2).
export const MAX_HASH_PATHS = 200;
export const hashesRequestSchema = z.object({
  paths: z.array(z.string()).max(MAX_HASH_PATHS),
});
export const hashesResponseSchema = z.object({
  hashes: z.record(z.string(), z.string().nullable()),
});
export type HashesResponse = z.infer<typeof hashesResponseSchema>;

// GET /api/state?root=<abs>: UI state in ~/.squiggle-studio/state.json.
// `global` is shared by every root; `root` is this root's slice.
export const stateResponseSchema = z.object({
  global: z.record(z.string(), z.unknown()),
  root: z.record(z.string(), z.unknown()),
});
export type StateResponse = z.infer<typeof stateResponseSchema>;

// PATCH /api/state: shallow per-key merge, atomic on the server.
export const patchStateRequestSchema = z.object({
  global: z.record(z.string(), z.unknown()).optional(),
  root: z
    .object({ path: z.string(), patch: z.record(z.string(), z.unknown()) })
    .optional(),
});
export type PatchStateRequest = z.infer<typeof patchStateRequestSchema>;
export const patchStateResponseSchema = z.object({ ok: z.literal(true) });

// GET /api/settings: ~/.squiggle-studio/settings.json as written (validated
// per key by the client, see settings.ts). `error` when the file doesn't
// parse; the server then never writes it.
export const settingsResponseSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
  path: z.string(), // absolute path of settings.json
  error: z.string().optional(),
});
export type SettingsResponse = z.infer<typeof settingsResponseSchema>;

// PUT /api/settings {patch} → the merged settings; 409 "settings-invalid" if
// the file on disk doesn't parse.
export const putSettingsRequestSchema = z.object({
  patch: z.record(z.string(), z.unknown()),
});

// Body of every non-2xx API response.
export const apiErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(), // one of API_ERROR_CODES, when it matters
  root: z.string().optional(), // current root, with code "root-changed"
  current: diskStateSchema.optional(), // with code "disk-changed"
  canonical: z.string().optional(), // with code "non-canonical-path"
});
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

export const API_ERROR_CODES = {
  // 409: the request's STUDIO_ROOT_HEADER doesn't match the open folder.
  rootChanged: "root-changed",
  // 409: creating, importing or renaming onto a file that already exists.
  fileExists: "file-exists",
  // 409: PUT /api/file with a baseHash that no longer matches the disk.
  diskChanged: "disk-changed",
  // 409: PUT /api/settings while settings.json on disk doesn't parse.
  settingsInvalid: "settings-invalid",
  // 400: a path that isn't in canonical form; `canonical` names it.
  nonCanonicalPath: "non-canonical-path",
  // 410: the open folder was moved or deleted.
  rootMissing: "root-missing",
} as const;

export const recentFolderSchema = z.object({
  path: z.string(),
  openedAt: z.number(),
});
export type RecentFolder = z.infer<typeof recentFolderSchema>;

export const recentFoldersSchema = z.array(recentFolderSchema);

export const openFolderRequestSchema = z.object({ path: z.string() });

export const browseResponseSchema = z.object({
  path: z.string(),
  parent: z.string().nullable(),
  dirs: z.array(z.string()),
});
export type BrowseResponse = z.infer<typeof browseResponseSchema>;

export const hubSourceResponseSchema = z.object({
  owner: z.string(),
  slug: z.string(),
  code: z.string(),
});

// POST /api/hub/import {id: "hub:owner/slug" or "owner/slug", path?,
// overwrite?} → {path, hash}. Nothing is written if the request was aborted
// (#49).
export const hubImportRequestSchema = z.object({
  id: z.string(),
  path: z.string().optional(), // destination, relative to root
  overwrite: z.boolean().optional(),
});
export const hubImportResponseSchema = z.object({
  path: z.string(), // canonical
  hash: z.string().default(""), // (pre-WP7 default)
});
export type HubImportResponse = z.infer<typeof hubImportResponseSchema>;

// TRANSITIONAL: the request body the server at HEAD accepts. WP7 switches the
// route to hubImportRequestSchema; integration deletes this.
export const legacyHubImportRequestSchema = z.object({
  owner: z.string(),
  slug: z.string(),
  path: z.string(), // destination, relative to root
  overwrite: z.boolean().optional(),
});

// Events pushed over Server-Sent Events at /api/events. Every event carries
// the server's `root`; clients drop events for a root other than their own
// (#13). "" only comes from a pre-WP7 server and means "unknown".
const eventRoot = z.string().default(""); // (pre-WP7 default)
export const studioEventSchema = z.discriminatedUnion("type", [
  // A file was created, changed or deleted. `exists` is false on deletion;
  // `hash` is the new content's hash (absent for deletions and big files).
  z.object({
    type: z.literal("file-changed"),
    root: eventRoot,
    path: z.string(),
    exists: z.boolean(),
    hash: z.string().optional(),
  }),
  // A directory changed in a way that may affect the tree.
  z.object({ type: z.literal("tree-changed"), root: eventRoot }),
  // The open root folder was switched (by another window or tab).
  z.object({ type: z.literal("root-changed"), root: z.string() }),
  // The open root folder was moved or deleted (#35).
  z.object({ type: z.literal("root-missing"), root: z.string() }),
  // ~/.squiggle-studio/settings.json changed.
  z.object({ type: z.literal("settings-changed") }),
]);
export type StudioEvent = z.output<typeof studioEventSchema>;
// What the server constructs (the pre-WP7 server omits `root`).
export type StudioEventInput = z.input<typeof studioEventSchema>;

// Custom header required on every API request. Browsers can't send custom
// headers cross-origin without a CORS preflight (which we never approve), so
// this blocks other websites from talking to the local server.
export const STUDIO_HEADER = "x-squiggle-studio";

// Optional header on file read/write/rename and Hub import requests: the
// absolute root folder the client believes is open, URI-encoded (header values
// must be ASCII). If it doesn't match the server's current root, the server
// responds 409 with code "root-changed", so that a buffer from one folder is
// never written into another after the root was switched.
export const STUDIO_ROOT_HEADER = "x-squiggle-studio-root";

export function encodeRootHeader(root: string): string {
  return encodeURIComponent(root);
}

// Returns undefined for malformed values.
export function decodeRootHeader(value: string): string | undefined {
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

// File extensions shown in the tree.
export const VISIBLE_EXTENSIONS = [".squiggle", ".json", ".md"];

export const HUB_PREFIX = "hub:";

// Parses `hub:owner/slug`.
export function parseHubImport(
  name: string
): { owner: string; slug: string } | undefined {
  const match = name.match(/^hub:([\w-]+)\/([\w-]+)$/);
  if (!match) return undefined;
  return { owner: match[1], slug: match[2] };
}
