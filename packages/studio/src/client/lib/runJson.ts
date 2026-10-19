// window.squiggleStudio.getRunJson() and Run ▸ Copy for Agent ▸ Output as
// JSON (spec §6.4–§6.5): the shown file's last finished run through
// squiggle-lang's own serializer, so the page reports exactly what
// `squiggle-studio run --json` prints (minus `timeMs` and its `studio` block;
// e2e/parity.e2e.test.ts checks both against the golden files).

import { type RunJson, sqModuleOutputToJson } from "@quri/squiggle-lang";

import type { ActiveRun } from "./stores/activeRun.js";

// `run` is the active-run store's value (published by the file's run host);
// `shownPath` the file the editor area shows. Null without a finished run of
// that file.
export function runJsonOf(
  run: ActiveRun | undefined,
  shownPath: string | null
): RunJson | null {
  if (!run?.output || run.path !== shownPath) return null;
  // The serializer reads sources only for error hints (the offending line).
  const sources =
    run.sources ?? new Map([[run.output.module.name, run.output.module.code]]);
  return sqModuleOutputToJson(run.output, sources);
}
