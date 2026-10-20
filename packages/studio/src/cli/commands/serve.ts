import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { Command } from "@commander-js/extra-typings";

import { isLoopbackHost, startStudioServer } from "../../server/server.js";
import { StudioUsageError } from "../../server/runner.js";
import { viewStateToSearch } from "../../shared/viewState.js";
import { parsePort } from "../args.js";

export { parsePort };

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

// URLs other machines can use, for wildcard hosts like 0.0.0.0.
function networkUrls(host: string, port: number): string[] {
  const wildcard = host === "0.0.0.0" || host === "::" || host === "[::]";
  if (!wildcard) return [];
  return Object.values(os.networkInterfaces())
    .flatMap((list) => list ?? [])
    .filter((i) => i.family === "IPv4" && !i.internal)
    .map((i) => `http://${i.address}:${port}`);
}

export type ServeTarget = {
  root: string; // absolute folder to open
  file?: string; // root-relative file to show (a file argument)
};

// `squiggle-studio <dir|file>`: a folder opens as is; a file opens its folder
// with the file shown (#50), as in the desktop app.
export function resolveServeTarget(
  arg: string,
  cwd: string = process.cwd()
): ServeTarget {
  const abs = path.resolve(cwd, arg);
  const stat = fs.statSync(abs, { throwIfNoEntry: false });
  if (!stat) throw new StudioUsageError(`No such file or folder: ${arg}`);
  if (stat.isDirectory()) return { root: abs };
  return { root: path.dirname(abs), file: path.basename(abs) };
}

// The address to print and open: the server's URL, plus `?file=` for a file.
export function serveUrl(serverUrl: string, target: ServeTarget): string {
  return target.file
    ? `${serverUrl}/${viewStateToSearch({ file: target.file })}`
    : serverUrl;
}

// `squiggle-studio [dir]`: serve a folder and open it in the browser. This is
// the default command, so it is defined on the program itself rather than as a
// subcommand.
export function register(program: Command): void {
  program
    .argument("[dir]", "folder to open, or a file to show in its folder", ".")
    .option("-p, --port <port>", "port to listen on", parsePort, 4321)
    .option("--host <host>", "host to bind to", "127.0.0.1")
    .option(
      "--allow-network",
      "allow a non-loopback --host such as 0.0.0.0 (anyone who can reach the port can read and write files in the folder)"
    )
    .option("--no-open", "don't open the browser")
    .option(
      "--dev",
      "serve the client with Vite (for developing Studio itself)"
    )
    .action(async (dir, options) => {
      const target = resolveServeTarget(dir);
      // startStudioServer refuses non-loopback hosts without allowNetwork.
      const server = await startStudioServer({
        root: target.root,
        port: options.port,
        host: options.host,
        allowNetwork: options.allowNetwork ?? false,
        dev: options.dev ?? false,
      });
      const url = serveUrl(server.url, target);
      process.stdout.write(
        `Squiggle Studio is running at ${url}\nServing ${server.getRoot()}\n`
      );
      if (!isLoopbackHost(options.host)) {
        for (const networkUrl of networkUrls(options.host, server.port)) {
          process.stdout.write(`On your network: ${networkUrl}\n`);
        }
        process.stderr.write(
          `\nWARNING: listening on ${options.host} (--allow-network). Anyone who can reach port ${server.port} can read and write files in ${server.getRoot()}; there is no authentication. Opening other folders is disabled.\n\n`
        );
      }
      if (options.open) openBrowser(url);

      const shutdown = () => {
        void server.close().then(() => process.exit(0));
      };
      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
    });
}
