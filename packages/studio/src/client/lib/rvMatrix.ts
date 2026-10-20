// The relative values pair matrix of the shown file, for agents
// (`window.squiggleStudio.getRvMatrix()`, §6.5) and Copy for Agent ▸ Relative
// Values as CSV. Same format and numbers as `squiggle-studio rv` (the
// relative-values bundle), computed in the page from the latest run.

import type { SqModuleOutput, SqProject } from "@quri/squiggle-lang";
import {
  createRelativeValuesBundle,
  ModelEvaluator,
  type RelativeValuesBundle,
  relativeValuesBundleToCsv,
  type RelativeValuesCsvOptions,
} from "@quri/squiggle-relative-values";

import { getPairCache, getRelativeValuesExports } from "../views/rv/rvState.js";
import { semanticKey } from "../views/rv/semanticKey.js";
import { registerAgentProvider } from "./agentHooks.js";
import { getActiveRun } from "./stores/activeRun.js";

// What the mounted relative values view shows (it registers itself), so that
// the matrix reuses its evaluator and pair cache.
export type RvLiveSource = {
  path: string;
  output: SqModuleOutput;
  project: SqProject;
  variable: string | undefined; // the spec the view shows
  evaluator?: { variable: string; key: string; evaluator: ModelEvaluator };
};

let live: RvLiveSource | undefined;

// Called by the relative values view while mounted; returns an unregister
// function.
export function setRvLiveSource(source: RvLiveSource): () => void {
  live = source;
  return () => {
    if (live === source) live = undefined;
  };
}

type Source = {
  path: string;
  output: SqModuleOutput;
  project?: SqProject;
  variable?: string;
  evaluator?: RvLiveSource["evaluator"];
};

// The mounted view's source, else the shown file's latest run (published by
// FileWorkspace, WP5), so it also works when another view is shown.
function currentSource(): Source | undefined {
  if (live) return live;
  const run = getActiveRun();
  return run?.output ? { path: run.path, output: run.output } : undefined;
}

export class RvMatrixError extends Error {}

// Resolves to null when no file with a relative values spec is shown. Rejects
// for an unknown `variable`, an invalid spec or a failed run, with the message
// the view shows.
export async function getRvMatrix(
  opts: { variable?: string } = {}
): Promise<RelativeValuesBundle | null> {
  const source = currentSource();
  if (!source) return null;
  const result = source.output.result;
  if (!result.ok) {
    throw new RvMatrixError(
      `The model failed to run: ${result.value.errors.map((e) => e.toString()).join("\n")}`
    );
  }
  const found = getRelativeValuesExports(source.output);
  if (found.length === 0) return null;
  const name = opts.variable ?? source.variable ?? found[0]?.name;
  const spec = found.find((f) => f.name === name);
  if (!spec) {
    throw new RvMatrixError(
      `No relative values spec named "${name}" in ${source.path}; specs: ${found.map((f) => f.name).join(", ")}`
    );
  }
  if (!spec.spec.ok) {
    throw new RvMatrixError(
      `${spec.name} looks like a relative values spec, but it's invalid: ${spec.spec.value}`
    );
  }
  const key = semanticKey(source.output.module);
  const shown =
    source.evaluator?.variable === spec.name && source.evaluator.key === key
      ? source.evaluator.evaluator
      : undefined;
  let evaluator = shown;
  if (!evaluator) {
    const built = await ModelEvaluator.fromSpec(spec.spec.value, {
      cache: source.project
        ? getPairCache(source.project, spec.name, key)
        : undefined,
    });
    if (!built.ok) throw new RvMatrixError(built.value);
    evaluator = built.value;
  }
  return createRelativeValuesBundle({
    definition: spec.spec.value.definition,
    evaluator,
    meta: {
      variableName: spec.name,
      generator: `squiggle-studio@${__STUDIO_VERSION__}`,
      file: source.path,
    },
  });
}

// The shown spec's matrix as CSV (wide medians by default).
export async function getRvMatrixCsv(
  opts: { variable?: string } & RelativeValuesCsvOptions = {}
): Promise<string> {
  const bundle = await getRvMatrix({ variable: opts.variable });
  if (!bundle) {
    throw new RvMatrixError("No relative values spec is shown");
  }
  return relativeValuesBundleToCsv(bundle, opts);
}

registerAgentProvider("getRvMatrix", (opts) => getRvMatrix(opts));
