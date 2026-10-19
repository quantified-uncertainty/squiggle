import fs from "node:fs/promises";
import type { ServerResponse } from "node:http";
import path from "node:path";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".map": "application/json; charset=utf-8",
};

// Serves the built client. Unknown paths fall back to index.html (SPA).
export async function serveStatic(
  clientDir: string,
  pathname: string,
  res: ServerResponse
): Promise<void> {
  const decoded = decodeURIComponent(pathname);
  const target = path.resolve(clientDir, "." + path.posix.normalize(decoded));
  const insideClient =
    target === clientDir || target.startsWith(clientDir + path.sep);

  let file = insideClient ? target : path.join(clientDir, "index.html");
  const stat = await fs.stat(file).catch(() => undefined);
  if (!stat?.isFile()) {
    file = path.join(clientDir, "index.html");
  }

  let data: Buffer;
  try {
    data = await fs.readFile(file);
  } catch {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end(
      `Squiggle Studio client is not built (looked in ${clientDir}). Run \`pnpm build\` in packages/studio, or start with --dev.`
    );
    return;
  }
  const ext = path.extname(file);
  const isAsset = file.includes(`${path.sep}assets${path.sep}`);
  res.writeHead(200, {
    "content-type": MIME_TYPES[ext] ?? "application/octet-stream",
    "cache-control": isAsset
      ? "public, max-age=31536000, immutable"
      : "no-cache",
  });
  res.end(data);
}
