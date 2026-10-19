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
//
// Packaged: [app, ...args]. Development: [electron, ...switches, appPath,
// ...args]: Chromium switches may come before the app path (`electron
// --inspect=5456 . models/`), so the app is the first positional argument,
// not argv[1]. Any other argument that resolves to `appPath` (app.getAppPath())
// is the app too, never a folder to open.
export function targetsFromArgv(
  argv: string[],
  isPackaged: boolean,
  opts: { appPath?: string; cwd?: string } = {}
): OpenTarget[] {
  const cwd = opts.cwd ?? process.cwd();
  const positional = argv.slice(1).filter((arg) => !arg.startsWith("-"));
  const args = isPackaged ? positional : positional.slice(1);
  const appPath = opts.appPath && path.resolve(opts.appPath);
  return args
    .filter((arg) => !appPath || path.resolve(cwd, arg) !== appPath)
    .map((arg) => resolveTarget(arg, cwd))
    .filter((t): t is OpenTarget => t !== undefined);
}
