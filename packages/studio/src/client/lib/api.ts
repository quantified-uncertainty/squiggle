import { z } from "zod";

import {
  type ApiErrorResponse,
  apiErrorResponseSchema,
  browseResponseSchema,
  type DiskState,
  encodeRootHeader,
  type FileResponse,
  fileResponseSchema,
  hashesResponseSchema,
  hubImportResponseSchema,
  hubSourceResponseSchema,
  patchStateResponseSchema,
  type PatchStateRequest,
  recentFoldersSchema,
  renameFileResponseSchema,
  rootInfoSchema,
  settingsResponseSchema,
  stateResponseSchema,
  STUDIO_HEADER,
  STUDIO_ROOT_HEADER,
  treeResponseSchema,
  writeFileResponseSchema,
} from "../../shared/api.js";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string, // see API_ERROR_CODES
    public readonly root?: string, // the server's root, with code "root-changed"
    // What is on disk now, with code "disk-changed" (409 from a guarded save).
    public readonly current?: DiskState,
    // The canonical form of the path, with code "non-canonical-path".
    public readonly canonical?: string
  ) {
    super(message);
  }

  static fromResponse(status: number, body: ApiErrorResponse): ApiError {
    return new ApiError(
      body.error,
      status,
      body.code,
      body.root,
      body.current,
      body.canonical
    );
  }
}

// The root folder this client believes is open. When set, file requests
// carry it in STUDIO_ROOT_HEADER and fail with ApiError code "root-changed"
// if the server has switched to another folder in the meantime.
let expectedRoot: string | undefined;

export function setExpectedRoot(root: string | undefined): void {
  expectedRoot = root;
}

// Every successful GET /api/file (the workspace's loads and the linker's
// imports) is reported here, so the workspace learns the disk hash of files
// it doesn't hold a buffer for (importers re-run only when a dependency's
// hash changes, #10).
let readObserver: ((file: FileResponse) => void) | undefined;

export function observeFileReads(
  cb: ((file: FileResponse) => void) | undefined
): void {
  readObserver = cb;
}

// Browsers cap the bodies of in-flight keepalive requests at 64 KiB; bigger
// saves go out as normal requests (best effort while the page unloads).
const KEEPALIVE_MAX_BODY = 60_000;

export function fitsKeepalive(content: string): boolean {
  return content.length * 3 < KEEPALIVE_MAX_BODY; // worst case UTF-8
}

async function request<T>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  url: string,
  init: {
    method?: string;
    body?: unknown;
    guardRoot?: boolean; // send STUDIO_ROOT_HEADER (file operations)
    signal?: AbortSignal;
    keepalive?: boolean; // survives pagehide (autosave flush)
  } = {}
): Promise<T> {
  const headers: Record<string, string> = { [STUDIO_HEADER]: "1" };
  if (init.body !== undefined) headers["content-type"] = "application/json";
  if (init.guardRoot && expectedRoot !== undefined) {
    headers[STUDIO_ROOT_HEADER] = encodeRootHeader(expectedRoot);
  }
  const response = await fetch(url, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: init.signal,
    keepalive: init.keepalive,
  });
  const json: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const parsed = apiErrorResponseSchema.safeParse(json);
    throw parsed.success
      ? ApiError.fromResponse(response.status, parsed.data)
      : new ApiError(`Request failed: ${response.status}`, response.status);
  }
  return schema.parse(json);
}

const q = (params: Record<string, string>) => new URLSearchParams(params);

export const api = {
  getRoot: () => request(rootInfoSchema, "/api/root"),
  openFolder: (path: string) =>
    request(rootInfoSchema, "/api/root", { method: "POST", body: { path } }),
  getTree: () => request(treeResponseSchema, "/api/tree", { guardRoot: true }),
  readFile: async (path: string) => {
    const file = await request(fileResponseSchema, `/api/file?${q({ path })}`, {
      guardRoot: true,
    });
    readObserver?.(file);
    return file;
  },
  // With `baseHash`, the server refuses the write with ApiError 409, code
  // "disk-changed" (and `current`), if the file on disk has another hash.
  writeFile: (
    path: string,
    content: string,
    opts: { baseHash?: string; keepalive?: boolean } = {}
  ) =>
    request(writeFileResponseSchema, "/api/file", {
      method: "PUT",
      body: {
        path,
        content,
        ...(opts.baseHash ? { baseHash: opts.baseHash } : {}),
      },
      guardRoot: true,
      keepalive: opts.keepalive && fitsKeepalive(content),
    }),
  // Fails with ApiError 409, code "file-exists", if the file exists.
  createFile: (path: string, content: string) =>
    request(writeFileResponseSchema, "/api/file", {
      method: "PUT",
      body: { path, content, create: true },
      guardRoot: true,
    }),
  // Renames or moves a file. Fails with ApiError 409, code "file-exists", if
  // `to` exists.
  renameFile: (from: string, to: string) =>
    request(renameFileResponseSchema, "/api/file/rename", {
      method: "POST",
      body: { from, to },
      guardRoot: true,
    }),
  // Current hashes of up to 200 paths (null: missing, "": over 5 MB).
  hashes: (paths: string[]) =>
    request(hashesResponseSchema, "/api/hashes", {
      method: "POST",
      body: { paths },
      guardRoot: true,
    }),
  getRecentFolders: () => request(recentFoldersSchema, "/api/recent"),
  browse: (path?: string) =>
    request(browseResponseSchema, `/api/browse?${q(path ? { path } : {})}`),
  getHubSource: (owner: string, slug: string) =>
    request(hubSourceResponseSchema, `/api/hub/source?${q({ owner, slug })}`),
  // `id`: "hub:owner/slug" or "owner/slug". Abort with `signal`; the server
  // writes nothing for an aborted request (#49).
  importFromHub: (params: {
    id: string;
    path?: string;
    overwrite?: boolean;
    signal?: AbortSignal;
  }) =>
    request(hubImportResponseSchema, "/api/hub/import", {
      method: "POST",
      body: { id: params.id, path: params.path, overwrite: params.overwrite },
      guardRoot: true,
      signal: params.signal,
    }),
  // UI state in ~/.squiggle-studio/state.json (403 in network mode, and
  // studioState then uses localStorage).
  getState: (root: string) =>
    request(stateResponseSchema, `/api/state?${q({ root })}`),
  patchState: (patch: PatchStateRequest, opts: { keepalive?: boolean } = {}) =>
    request(patchStateResponseSchema, "/api/state", {
      method: "PATCH",
      body: patch,
      keepalive: opts.keepalive,
    }),
  // ~/.squiggle-studio/settings.json (403 in network mode).
  getSettings: () => request(settingsResponseSchema, "/api/settings"),
  // 409 "settings-invalid" when the file on disk doesn't parse.
  putSettings: (patch: Record<string, unknown>) =>
    request(settingsResponseSchema, "/api/settings", {
      method: "PUT",
      body: { patch },
    }),
};
