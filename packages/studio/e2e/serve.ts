import { parseArgs } from "node:util";

import { startFixtureServer } from "./lib/harness.js";

// `pnpm e2e:serve [--fixtures <subfolder>] [--hub stub|none] [--dev]`
//
// Starts Studio on a temporary copy of the e2e fixtures (with the Hub stub and
// an isolated state folder, like the harness) for manual or agent driving, and
// prints one JSON line: {"url", "root", "stateDir", "hub"}. Open
// `<url>/?file=values/numbers.squiggle&test=1`, then drive it by test id and
// `await window.squiggleStudio.whenIdle()`. Ctrl+C stops it and deletes the
// copy. --dev serves the client through Vite (live code changes; never use it
// for screenshots, its HMR socket keeps the page from settling).

const { values } = parseArgs({
  options: {
    fixtures: { type: "string" },
    hub: { type: "string", default: "stub" },
    dev: { type: "boolean", default: false },
  },
});
if (values.hub !== "stub" && values.hub !== "none") {
  throw new Error(`--hub must be "stub" or "none", got "${values.hub}"`);
}

const server = await startFixtureServer({
  fixtures: values.fixtures,
  hub: values.hub,
  dev: values.dev,
});
process.stdout.write(
  `${JSON.stringify({ url: server.url, root: server.root, stateDir: server.stateDir, hub: server.hub?.url ?? null })}\n`
);

let stopping = false;
const shutdown = () => {
  if (stopping) return;
  stopping = true;
  void server.stop().then(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
