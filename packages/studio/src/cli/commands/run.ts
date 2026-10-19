import type { Command } from "@commander-js/extra-typings";

// Stub, filled in by WP8 (spec §6.3):
//   squiggle-studio run <file> [--json] [--root <dir>] [--seed <s>]
//     [-n, --sample-count <n>] [--only a,b.c] [--timeout <30s>]
// It runs a file with Studio's import rules (src/server/runner.ts) and prints
// squiggle's RunJson plus a `studio` block. Until then it registers nothing,
// so the CLI behaves exactly as before the command split.
export function register(_program: Command): void {}
