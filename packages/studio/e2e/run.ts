import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

// `pnpm e2e [--skip-needs] [--strict] [--only <tag|id>]... [--merged WP4,WP5]
//           [vitest options]`
//
// Runs the e2e suite (vitest.e2e.config.ts) with the harness options passed as
// environment variables (see studio.e2e.test.ts), because vitest rejects
// options it doesn't know. Everything else goes to vitest, e.g. `-t open-file`.

const STUDIO_DIR = path.resolve(import.meta.dirname, "..");

const env: Record<string, string> = {};
const only: string[] = [];
const rest: string[] = [];
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const arg = args[i] ?? "";
  const value = (flag: string): string => {
    const inline = arg.startsWith(`${flag}=`)
      ? arg.slice(flag.length + 1)
      : undefined;
    if (inline !== undefined) return inline;
    const next = args[i + 1];
    if (next === undefined) throw new Error(`${flag} needs a value`);
    i++;
    return next;
  };
  if (arg === "--") continue;
  if (arg === "--skip-needs") env["STUDIO_E2E_SKIP_NEEDS"] = "1";
  else if (arg === "--strict") env["STUDIO_E2E_STRICT"] = "1";
  else if (arg === "--only" || arg.startsWith("--only="))
    only.push(value("--only"));
  else if (arg === "--merged" || arg.startsWith("--merged=")) {
    env["STUDIO_E2E_MERGED"] = value("--merged");
  } else rest.push(arg);
}
if (only.length) env["STUDIO_E2E_ONLY"] = only.join(",");

const require = createRequire(import.meta.url);
const vitest = path.join(
  path.dirname(require.resolve("vitest/package.json")),
  "vitest.mjs"
);
const child = spawn(
  process.execPath,
  [vitest, "run", "--config", "vitest.e2e.config.ts", ...rest],
  { cwd: STUDIO_DIR, stdio: "inherit", env: { ...process.env, ...env } }
);
child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
