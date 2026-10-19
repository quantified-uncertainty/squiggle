import fs from "node:fs/promises";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

import {
  hubImportRequestSchema,
  openFolderRequestSchema,
  STUDIO_HEADER,
  type StudioEvent,
  writeFileRequestSchema,
} from "../shared/api.js";
import { listTree, readFile, writeFile } from "./files.js";
import { HubError, makeHubClient } from "./hub.js";
import { PathError } from "./paths.js";
import {
  addRecentFolder,
  defaultRecentFile,
  loadRecentFolders,
} from "./recent.js";
import { serveStatic } from "./static.js";
import { type FolderWatcher, watchFolder } from "./watcher.js";

export type StudioServerOptions = {
  root: string; // folder to open initially
  port?: number; // default 4321; 0 picks a random free port
  host?: string; // default 127.0.0.1
  strictPort?: boolean; // if false (default), try the next ports when busy
  dev?: boolean; // serve the client through Vite middleware (requires vite)
  clientDir?: string; // directory with the built client; defaults to dist/client
  recentFile?: string; // defaults to ~/.squiggle-studio/recent.json
  hubUrl?: string; // defaults to https://squigglehub.org
  allowOpenFolder?: boolean; // allow the client to switch root folders; default true
};

export type StudioServer = {
  url: string;
  port: number;
  getRoot: () => string;
  openFolder: (folder: string) => Promise<void>;
  close: () => Promise<void>;
};

const MAX_BODY_BYTES = 10 * 1024 * 1024;

class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(data);
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = chunk instanceof Buffer ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > MAX_BODY_BYTES) throw new HttpError("Body too large", 413);
    chunks.push(buf);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
  } catch {
    throw new HttpError("Invalid JSON body", 400);
  }
}

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(`Invalid request: ${parsed.error.message}`, 400);
  }
  return parsed.data;
}

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

// Protects against DNS rebinding: only accept requests addressed to us.
function isAllowedHost(req: IncomingMessage, host: string): boolean {
  const header = req.headers.host;
  if (!header) return false;
  const hostname = header.replace(/:\d+$/, "");
  return LOCAL_HOSTNAMES.has(hostname) || hostname === host;
}

function packageDir(): string {
  // dist/server/server.js or src/server/server.ts -> package root
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

async function assertDirectory(folder: string): Promise<string> {
  const abs = path.resolve(folder);
  const stat = await fs.stat(abs).catch(() => undefined);
  if (!stat?.isDirectory()) {
    throw new HttpError(`Not a directory: ${abs}`, 400);
  }
  return abs;
}

async function listen(
  server: http.Server,
  port: number,
  host: string,
  strictPort: boolean
): Promise<number> {
  const maxAttempts = strictPort || port === 0 ? 1 : 20;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tryPort = port === 0 ? 0 : port + attempt;
    try {
      await new Promise<void>((resolve, reject) => {
        const onError = (e: Error) => {
          server.off("listening", onListening);
          reject(e);
        };
        const onListening = () => {
          server.off("error", onError);
          resolve();
        };
        server.once("error", onError);
        server.once("listening", onListening);
        server.listen(tryPort, host);
      });
      return (server.address() as AddressInfo).port;
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code !== "EADDRINUSE" || attempt === maxAttempts - 1) throw e;
    }
  }
  throw new Error("Unreachable");
}

export async function startStudioServer(
  options: StudioServerOptions
): Promise<StudioServer> {
  const host = options.host ?? "127.0.0.1";
  const recentFile = options.recentFile ?? defaultRecentFile();
  const hub = makeHubClient(options.hubUrl);
  const allowOpenFolder = options.allowOpenFolder ?? true;

  let root = await assertDirectory(options.root);
  let watcher: FolderWatcher | undefined;
  const sseClients = new Set<ServerResponse>();

  const broadcast = (event: StudioEvent) => {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of sseClients) client.write(data);
  };

  const startWatcher = () => {
    watcher?.close();
    watcher = watchFolder(root, broadcast);
  };

  const openFolder = async (folder: string) => {
    root = await assertDirectory(folder);
    startWatcher();
    await addRecentFolder(recentFile, root).catch(() => undefined);
    broadcast({ type: "root-changed", root });
  };

  startWatcher();
  await addRecentFolder(recentFile, root).catch(() => undefined);

  type Vite = import("vite").ViteDevServer;
  let vite: Vite | undefined;
  if (options.dev) {
    const { createServer } = await import("vite");
    vite = await createServer({
      configFile: path.join(packageDir(), "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
    });
  }
  const clientDir =
    options.clientDir ?? path.join(packageDir(), "dist", "client");

  const handleApi = async (
    req: IncomingMessage,
    res: ServerResponse,
    url: URL
  ) => {
    const method = req.method ?? "GET";
    const route = `${method} ${url.pathname}`;

    if (route === "GET /api/events") {
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-store",
        connection: "keep-alive",
      });
      res.write(`retry: 1000\n\n`);
      sseClients.add(res);
      const ping = setInterval(() => res.write(`: ping\n\n`), 25_000);
      req.on("close", () => {
        clearInterval(ping);
        sseClients.delete(res);
      });
      return;
    }

    // Every other API request must carry our custom header (see STUDIO_HEADER).
    if (req.headers[STUDIO_HEADER] !== "1") {
      throw new HttpError(`Missing ${STUDIO_HEADER} header`, 403);
    }

    switch (route) {
      case "GET /api/root":
        return sendJson(res, 200, { root, name: path.basename(root) });
      case "POST /api/root": {
        if (!allowOpenFolder) {
          throw new HttpError("Opening other folders is disabled", 403);
        }
        const body = parseBody(
          openFolderRequestSchema,
          await readJsonBody(req)
        );
        const folder = body.path.startsWith("~")
          ? path.join(os.homedir(), body.path.slice(1))
          : body.path;
        await openFolder(folder);
        return sendJson(res, 200, { root, name: path.basename(root) });
      }
      case "GET /api/tree":
        return sendJson(res, 200, { root, tree: await listTree(root) });
      case "GET /api/file": {
        const p = url.searchParams.get("path") ?? "";
        return sendJson(res, 200, await readFile(root, p));
      }
      case "PUT /api/file": {
        const body = parseBody(writeFileRequestSchema, await readJsonBody(req));
        return sendJson(
          res,
          200,
          await writeFile(root, body.path, body.content)
        );
      }
      case "GET /api/recent":
        return sendJson(res, 200, await loadRecentFolders(recentFile));
      case "GET /api/browse": {
        if (!allowOpenFolder) {
          throw new HttpError("Opening other folders is disabled", 403);
        }
        const requested = url.searchParams.get("path") || os.homedir();
        const dir = await assertDirectory(requested);
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const dirs = entries
          .filter((e) => e.isDirectory() && !e.name.startsWith("."))
          .map((e) => e.name)
          .sort((a, b) => a.localeCompare(b));
        const parent = path.dirname(dir);
        return sendJson(res, 200, {
          path: dir,
          parent: parent === dir ? null : parent,
          dirs,
        });
      }
      case "GET /api/hub/source": {
        const owner = url.searchParams.get("owner") ?? "";
        const slug = url.searchParams.get("slug") ?? "";
        if (!/^[\w-]+$/.test(owner) || !/^[\w-]+$/.test(slug)) {
          throw new HttpError("Invalid owner or slug", 400);
        }
        const code = await hub.getSource(owner, slug);
        return sendJson(res, 200, { owner, slug, code });
      }
      case "POST /api/hub/import": {
        const body = parseBody(hubImportRequestSchema, await readJsonBody(req));
        if (!/^[\w-]+$/.test(body.owner) || !/^[\w-]+$/.test(body.slug)) {
          throw new HttpError("Invalid owner or slug", 400);
        }
        const code = await hub.getSource(body.owner, body.slug);
        const header = `// Imported from ${hub.hubUrl}/models/${body.owner}/${body.slug} on ${new Date().toISOString().slice(0, 10)}\n\n`;
        const result = await writeFile(root, body.path, header + code, {
          overwrite: body.overwrite ?? false,
        });
        return sendJson(res, 200, result);
      }
      default:
        throw new HttpError(`Not found: ${route}`, 404);
    }
  };

  const server = http.createServer((req, res) => {
    if (!isAllowedHost(req, host)) {
      res.writeHead(403).end("Forbidden host");
      return;
    }
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname.startsWith("/api/")) {
      handleApi(req, res, url).catch((e: unknown) => {
        const status =
          e instanceof HttpError ||
          e instanceof PathError ||
          e instanceof HubError
            ? e.status
            : 500;
        const message = e instanceof Error ? e.message : String(e);
        if (!res.headersSent) sendJson(res, status, { error: message });
        else res.end();
      });
      return;
    }
    if (vite) {
      vite.middlewares(req, res);
      return;
    }
    serveStatic(clientDir, url.pathname, res).catch((e: unknown) => {
      res.writeHead(500).end(e instanceof Error ? e.message : String(e));
    });
  });

  const port = await listen(
    server,
    options.port ?? 4321,
    host,
    options.strictPort ?? false
  );
  const displayHost = host === "0.0.0.0" || host === "::" ? "localhost" : host;

  return {
    url: `http://${displayHost.includes(":") ? `[${displayHost}]` : displayHost}:${port}`,
    port,
    getRoot: () => root,
    openFolder,
    async close() {
      watcher?.close();
      for (const client of sseClients) client.end();
      sseClients.clear();
      await vite?.close();
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      });
    },
  };
}
