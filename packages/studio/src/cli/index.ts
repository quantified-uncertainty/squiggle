import { spawn } from "node:child_process";
import path from "node:path";

import { Command, InvalidArgumentError } from "@commander-js/extra-typings";

import { startStudioServer } from "../server/server.js";
import { renderToPng } from "./render.js";

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new InvalidArgumentError("Port must be an integer from 0 to 65535.");
  }
  return port;
}

function openBrowser(url: string) {
  const [cmd, args] =
    process.platform === "darwin"
      ? ["open", [url]]
      : process.platform === "win32"
        ? ["cmd", ["/c", "start", "", url]]
        : ["xdg-open", [url]];
  const child = spawn(cmd, args, { stdio: "ignore", detached: true });
  child.on("error", () => {
    // No browser available (e.g. headless machine); the URL is printed anyway.
  });
  child.unref();
}

const program = new Command()
  .name("squiggle-studio")
  .description("Edit and view .squiggle files in your browser.")
  .argument("[dir]", "folder to open", ".")
  .option("-p, --port <port>", "port to listen on", parsePort, 4321)
  .option("--host <host>", "host to bind to", "127.0.0.1")
  .option("--no-open", "don't open the browser")
  .option("--dev", "serve the client with Vite (for developing Studio itself)")
  .action(async (dir, options) => {
    const server = await startStudioServer({
      root: path.resolve(dir),
      port: options.port,
      host: options.host,
      dev: options.dev ?? false,
    });
    process.stdout.write(
      `Squiggle Studio is running at ${server.url}\nServing ${server.getRoot()}\n`
    );
    if (options.open) openBrowser(server.url);

    const shutdown = () => {
      void server.close().then(() => process.exit(0));
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  });

program
  .command("render")
  .description(
    "Render a .squiggle file's output to a PNG (requires puppeteer-core and a local Chrome)."
  )
  .argument("<file>", ".squiggle file to render")
  .option("-o, --out <file>", "output PNG path (default: <file>.png)")
  .option(
    "--variable <name>",
    "render only this variable (with --view relative-values: the spec to show)"
  )
  .option(
    "--view <id>",
    'view to render: "output" (default) or "relative-values"'
  )
  .option(
    "--tab <tab>",
    'relative values tab: "list" (default), "grid" or "plot"'
  )
  .option("--width <px>", "viewport width", parsePort, 1000)
  .option("--chrome <path>", "path to a Chrome/Chromium executable")
  .action(async (file, options) => {
    const out = await renderToPng({
      file: path.resolve(file),
      out: options.out ? path.resolve(options.out) : undefined,
      variable: options.variable,
      view: options.view,
      tab: options.tab,
      width: options.width,
      chromePath: options.chrome,
    });
    process.stdout.write(`Wrote ${out}\n`);
  });

program.parseAsync().catch((e: unknown) => {
  process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
