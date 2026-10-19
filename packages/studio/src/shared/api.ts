// Types and schemas shared by the Studio server and client.
// Paths exchanged over the API are always POSIX-style and relative to the
// currently open root folder (e.g. "models/main.squiggle").
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

export const rootInfoSchema = z.object({
  root: z.string(), // absolute path of the open folder
  name: z.string(), // basename of the open folder
});
export type RootInfo = z.infer<typeof rootInfoSchema>;

export const treeResponseSchema = z.object({
  root: z.string(),
  tree: z.array(treeNodeSchema),
});

export const fileResponseSchema = z.object({
  path: z.string(),
  content: z.string(),
  mtimeMs: z.number(),
});
export type FileResponse = z.infer<typeof fileResponseSchema>;

export const writeFileRequestSchema = z.object({
  path: z.string(),
  content: z.string(),
  create: z.boolean().optional(), // fail with 409 "file-exists" if it exists
});

export const writeFileResponseSchema = z.object({
  path: z.string(),
  mtimeMs: z.number(),
});

export const renameFileRequestSchema = z.object({
  from: z.string(),
  to: z.string(), // must not exist yet
});

export const renameFileResponseSchema = z.object({
  from: z.string(),
  to: z.string(),
  mtimeMs: z.number(),
});

// Body of every non-2xx API response.
export const apiErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(), // one of API_ERROR_CODES, when it matters
  root: z.string().optional(), // current root, with code "root-changed"
});

export const API_ERROR_CODES = {
  // 409: the request's STUDIO_ROOT_HEADER doesn't match the open folder.
  rootChanged: "root-changed",
  // 409: creating, importing or renaming onto a file that already exists.
  fileExists: "file-exists",
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

export const hubImportRequestSchema = z.object({
  owner: z.string(),
  slug: z.string(),
  path: z.string(), // destination, relative to root
  overwrite: z.boolean().optional(),
});

// Events pushed over Server-Sent Events at /api/events.
export const studioEventSchema = z.discriminatedUnion("type", [
  // A file was created, changed or deleted. `exists` is false on deletion.
  z.object({
    type: z.literal("file-changed"),
    path: z.string(),
    exists: z.boolean(),
  }),
  // A directory changed in a way that may affect the tree.
  z.object({ type: z.literal("tree-changed") }),
  // The open root folder was switched.
  z.object({ type: z.literal("root-changed"), root: z.string() }),
]);
export type StudioEvent = z.infer<typeof studioEventSchema>;

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
