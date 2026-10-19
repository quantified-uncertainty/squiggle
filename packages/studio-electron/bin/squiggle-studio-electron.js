#!/usr/bin/env node
// Launches the desktop app: `squiggle-studio-electron [folder-or-file...]`.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import electronPath from "electron";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const child = spawn(electronPath, [appDir, ...process.argv.slice(2)], {
  stdio: "inherit",
});
child.on("close", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
