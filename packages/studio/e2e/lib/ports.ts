import net, { type AddressInfo } from "node:net";

// Port selection for the servers the harness starts (Studio and the Hub stub).
//
// By default every server gets a free port chosen by the OS. Set
// STUDIO_E2E_PORTS=5210-5219 to keep them inside a range (when several agents
// or worktrees share one machine, each can get its own range).

export function portRange(): number[] | undefined {
  const value = process.env["STUDIO_E2E_PORTS"];
  if (!value) return undefined;
  const match = /^(\d+)-(\d+)$/.exec(value.trim());
  if (!match) {
    throw new Error(
      `STUDIO_E2E_PORTS must look like 5210-5219, got "${value}"`
    );
  }
  const from = Number(match[1]);
  const to = Number(match[2]);
  if (!(from > 0 && to >= from && to <= 65535)) {
    throw new Error(`Invalid STUDIO_E2E_PORTS range "${value}"`);
  }
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

// Binds 127.0.0.1:port (0: any free port), then releases it. Resolves to the
// port, or undefined if it is in use.
function probe(port: number): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", (e: NodeJS.ErrnoException) => {
      if (e.code === "EADDRINUSE" || e.code === "EACCES") resolve(undefined);
      else reject(e);
    });
    server.listen(port, "127.0.0.1", () => {
      const { port: bound } = server.address() as AddressInfo;
      server.close(() => resolve(bound));
    });
  });
}

// A port that was free a moment ago: the first free one of STUDIO_E2E_PORTS,
// or one chosen by the OS. (Probing first, rather than retrying the real
// server, matters for Studio: startStudioServer starts a folder watcher before
// it listens, and doesn't stop it when listening fails.)
export async function freePort(): Promise<number> {
  const range = portRange();
  if (!range) {
    const port = await probe(0);
    if (port === undefined) throw new Error("Couldn't get a free port");
    return port;
  }
  for (const candidate of range) {
    const port = await probe(candidate);
    if (port !== undefined) return port;
  }
  throw new Error(
    `No free port in STUDIO_E2E_PORTS=${process.env["STUDIO_E2E_PORTS"]}`
  );
}
