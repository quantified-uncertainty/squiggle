import type { Command } from "@commander-js/extra-typings";

// Stub, filled in by WP6 (spec §6.3):
//   squiggle-studio rv <file> [--variable <name>] [--format json|csv]
//     [--metric median|mean|min|max|uncertainty] [--unit <id>] [--long]
//     [--precision <digits>] [--root <dir>]
// It prints the relative values pair matrix (the relative-values bundle
// format, or CSV). Until then it registers nothing, so the CLI behaves exactly
// as before the command split.
export function register(_program: Command): void {}
