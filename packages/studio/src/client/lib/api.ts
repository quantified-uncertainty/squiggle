import { z } from "zod";

import {
  browseResponseSchema,
  fileResponseSchema,
  hubSourceResponseSchema,
  recentFoldersSchema,
  rootInfoSchema,
  STUDIO_HEADER,
  treeResponseSchema,
  writeFileResponseSchema,
} from "../../shared/api.js";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

const errorSchema = z.object({ error: z.string() });

async function request<T>(
  schema: z.ZodType<T>,
  url: string,
  init: { method?: string; body?: unknown } = {}
): Promise<T> {
  const response = await fetch(url, {
    method: init.method ?? "GET",
    headers: {
      [STUDIO_HEADER]: "1",
      ...(init.body === undefined
        ? {}
        : { "content-type": "application/json" }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const json: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const parsed = errorSchema.safeParse(json);
    throw new ApiError(
      parsed.success ? parsed.data.error : `Request failed: ${response.status}`,
      response.status
    );
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
    request(fileResponseSchema, `/api/file?${q({ path })}`),
  writeFile: (path: string, content: string) =>
    request(writeFileResponseSchema, "/api/file", {
      method: "PUT",
      body: { path, content },
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
    }),
};
