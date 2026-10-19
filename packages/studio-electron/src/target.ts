import fs from "node:fs";
import path from "node:path";

// What to open in a window: a folder, and optionally a file inside it.
export type OpenTarget = {
  folder: string;
  file?: string; // POSIX path relative to `folder`
};

// Accepts a folder or a file path (absolute, or relative to `cwd`).
// Returns undefined if the path doesn't exist.
export function resolveTarget(
  input: string,
  cwd: string = process.cwd()
): OpenTarget | undefined {
  const abs = path.resolve(cwd, input);
  const stat = fs.statSync(abs, { throwIfNoEntry: false });
  if (!stat) return undefined;
  if (stat.isDirectory()) return { folder: abs };
  return {
    folder: path.dirname(abs),
    file: path.basename(abs),
  };
}

// Extracts folder/file paths from a command line, skipping Chromium/Electron
// flags (`--foo`, macOS `-psn_...`) and, in development, the app path itself.
export function targetsFromArgv(
  argv: string[],
  isPackaged: boolean
): OpenTarget[] {
  // Packaged: [app, ...args]. Development: [electron, appPath, ...args].
  const args = argv.slice(isPackaged ? 1 : 2);
  return args
    .filter((arg) => !arg.startsWith("-"))
    .map((arg) => resolveTarget(arg))
    .filter((t): t is OpenTarget => t !== undefined);
}
