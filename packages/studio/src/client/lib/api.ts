import { z } from "zod";

import {
  apiErrorResponseSchema,
  browseResponseSchema,
  encodeRootHeader,
  fileResponseSchema,
  hubSourceResponseSchema,
  recentFoldersSchema,
  renameFileResponseSchema,
  rootInfoSchema,
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
    public readonly root?: string // the server's root, with code "root-changed"
  ) {
    super(message);
  }
}

// The root folder this client believes is open. When set, file requests
// carry it in STUDIO_ROOT_HEADER and fail with ApiError code "root-changed"
// if the server has switched to another folder in the meantime.
let expectedRoot: string | undefined;

export function setExpectedRoot(root: string | undefined): void {
  expectedRoot = root;
}

async function request<T>(
  schema: z.ZodType<T>,
  url: string,
  init: {
    method?: string;
    body?: unknown;
    guardRoot?: boolean; // send STUDIO_ROOT_HEADER (file operations)
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
  });
  const json: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const parsed = apiErrorResponseSchema.safeParse(json);
    throw parsed.success
      ? new ApiError(
          parsed.data.error,
          response.status,
          parsed.data.code,
          parsed.data.root
        )
      : new ApiError(`Request failed: ${response.status}`, response.status);
  }
  return schema.parse(json);
}

const q = (params: Record<string, string>) => new URLSearchParams(params);

export const api = {
  getRoot: () => request(rootInfoSchema, "/api/root"),
  openFolder: (path: string) =>
    request(rootInfoSchema, "/api/root", { method: "POST", body: { path } }),
  getTree: () => request(treeResponseSchema, "/api/tree"),
  readFile: (path: string) =>
    request(fileResponseSchema, `/api/file?${q({ path })}`, {
      guardRoot: true,
    }),
  writeFile: (path: string, content: string) =>
    request(writeFileResponseSchema, "/api/file", {
      method: "PUT",
      body: { path, content },
      guardRoot: true,
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
  getRecentFolders: () => request(recentFoldersSchema, "/api/recent"),
  browse: (path?: string) =>
    request(browseResponseSchema, `/api/browse?${q(path ? { path } : {})}`),
  getHubSource: (owner: string, slug: string) =>
    request(hubSourceResponseSchema, `/api/hub/source?${q({ owner, slug })}`),
  importFromHub: (params: {
    owner: string;
    slug: string;
    path: string;
    overwrite?: boolean;
  }) =>
    request(writeFileResponseSchema, "/api/hub/import", {
      method: "POST",
      body: params,
      guardRoot: true,
    }),
};
