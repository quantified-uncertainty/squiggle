import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

import { freePort } from "./ports.js";

// A local stand-in for Squiggle Hub's public `/api/get-source` endpoint
// (see src/server/hub.ts), serving `<dir>/<owner>/<slug>.squiggle`.
//
// A model whose first line is `// stub-delay-ms: <n>` is served after n ms,
// so tests can cancel a slow import. Unknown models answer 404.

export const HUB_STUB_DIR = path.join(
  import.meta.dirname,
  "..",
  "fixtures",
  "hub-stub"
);

export type HubStub = {
  url: string;
  requests: string[]; // "owner/slug" for every request, in order
  close(): Promise<void>;
};

const ID = /^[\w-]+$/;
const DELAY = /^\/\/\s*stub-delay-ms:\s*(\d+)/;

export async function startHubStub(
  opts: {
    dir?: string; // default: e2e/fixtures/hub-stub
    port?: number; // default: a free port (see ports.ts)
  } = {}
): Promise<HubStub> {
  const dir = opts.dir ?? HUB_STUB_DIR;
  const requests: string[] = [];

  const server = http.createServer((req, res) => {
    const send = (status: number, body: unknown) => {
      if (res.destroyed) return; // the client gave up (e.g. a cancelled import)
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname !== "/api/get-source") {
      send(404, { error: `Not found: ${url.pathname}` });
      return;
    }
    const owner = url.searchParams.get("owner") ?? "";
    const slug = url.searchParams.get("slug") ?? "";
    requests.push(`${owner}/${slug}`);
    if (!ID.test(owner) || !ID.test(slug)) {
      send(400, { error: "Invalid owner or slug" });
      return;
    }
    fs.readFile(path.join(dir, owner, `${slug}.squiggle`), "utf-8").then(
      (code) => {
        const delay = Number(DELAY.exec(code)?.[1] ?? 0);
        setTimeout(() => send(200, { code }), delay);
      },
      () => send(404, { error: `Model not found: ${owner}/${slug}` })
    );
  });

  const port = opts.port ?? (await freePort());
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      }),
  };
}
