import { FC, useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { SquiggleErrorAlert } from "@quri/squiggle-components";
import type { SqModuleOutput, SqProject } from "@quri/squiggle-lang";
import {
  findRelativeValuesExports,
  InMemoryRelativeValuesCache,
  ModelEvaluator,
  RelativeValuesDashboard,
  type RelativeValuesExport,
  type RelativeValuesSpec,
  type RelativeValuesTab,
} from "@quri/squiggle-relative-values";
import { RefreshIcon } from "@quri/ui";

import { readStorage, writeStorage } from "../lib/storage.js";
import type { StudioRunOutput, StudioViewContext } from "./types.js";

// `isAvailable` runs on every render, so detection is memoized per run.
const exportsByOutput = new WeakMap<SqModuleOutput, RelativeValuesExport[]>();

export function getRelativeValuesExports(
  output: SqModuleOutput
): RelativeValuesExport[] {
  let found = exportsByOutput.get(output);
  if (!found) {
    found = findRelativeValuesExports(output);
    exportsByOutput.set(output, found);
  }
  return found;
}

// Files that had a relative values spec in an earlier run. The tab stays
// visible for them while the model is broken (e.g. a syntax error in the middle
// of an edit), instead of jumping back to another view.
const filesWithSpecs = new Set<string>();

export function hasRelativeValues(
  filePath: string,
  runOutput: StudioRunOutput | undefined
): boolean {
  if (!runOutput) return filesWithSpecs.has(filePath);
  if (!runOutput.output.result.ok) return filesWithSpecs.has(filePath);
  const found = getRelativeValuesExports(runOutput.output).length > 0;
  if (found) filesWithSpecs.add(filePath);
  else filesWithSpecs.delete(filePath);
  return found;
}

// Pair caches, per project (a project lives until the file's imports change on
// disk) and per (variable, code) version. Re-renders, tab switches and returning
// to an earlier version of the code (e.g. undo) reuse computed pairs.
const MAX_CACHES_PER_PROJECT = 20;
const cachesByProject = new WeakMap<
  SqProject,
  Map<string, InMemoryRelativeValuesCache>
>();

function getPairCache(
  project: SqProject,
  variable: string,
  code: string
): InMemoryRelativeValuesCache {
  let caches = cachesByProject.get(project);
  if (!caches) {
    caches = new Map();
    cachesByProject.set(project, caches);
  }
  const key = `${variable}\0${code}`;
  let cache = caches.get(key);
  if (cache) {
    // Map preserves insertion order; move to the end (most recently used).
    caches.delete(key);
  } else {
    cache = new InMemoryRelativeValuesCache();
  }
  caches.set(key, cache);
  while (caches.size > MAX_CACHES_PER_PROJECT) {
    caches.delete(caches.keys().next().value as string);
  }
  return cache;
}

// UI state per file, kept across live reloads and page reloads.
const uiStateSchema = z.object({
  variable: z.string().optional(),
  tab: z.enum(["list", "grid", "plot"]).optional(),
});
type UiState = z.infer<typeof uiStateSchema>;
const tabSchema = uiStateSchema.shape.tab;

// `?tab=grid` (used by `squiggle-studio render --tab`) overrides the saved tab.
const urlTab = tabSchema.safeParse(
  new URLSearchParams(window.location.search).get("tab") ?? undefined
).data;

const uiStateKey = (filePath: string) =>
  `squiggle-studio:relative-values:${filePath}`;

// In-memory copy, in case localStorage is unavailable. The view remounts when
// a file's imports change on disk.
const uiStateMemory = new Map<string, UiState>();

function useUiState(filePath: string) {
  const [state, setState] = useState<UiState>(() => {
    const saved =
      uiStateMemory.get(filePath) ??
      readStorage(uiStateKey(filePath), uiStateSchema) ??
      {};
    return urlTab ? { ...saved, tab: urlTab } : saved;
  });
  const update = (patch: UiState) => {
    const next = { ...state, ...patch };
    setState(next);
    uiStateMemory.set(filePath, next);
    writeStorage(uiStateKey(filePath), next);
  };
  return [state, update] as const;
}

type EvaluatorState = {
  spec: RelativeValuesSpec;
  evaluator: ModelEvaluator;
};

// Builds an evaluator for the spec. Until a new evaluator is ready, the
// previous one is kept, so that live reloads don't flash a spinner (and don't
// reset the dashboard's sorting and filters).
function useEvaluator(
  spec: RelativeValuesSpec | undefined,
  project: SqProject,
  variable: string,
  modelCode: string
) {
  const [state, setState] = useState<EvaluatorState | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!spec) return;
    let cancelled = false;
    ModelEvaluator.fromSpec(spec, {
      cache: getPairCache(project, variable, modelCode),
      modelCode,
    }).then(
      (result) => {
        if (cancelled) return;
        if (result.ok) {
          setState({ spec, evaluator: result.value });
          setError(undefined);
        } else {
          setError(result.value);
        }
      },
      (e: unknown) => {
        if (!cancelled) setError(String(e));
      }
    );
    return () => {
      cancelled = true;
    };
  }, [spec, project, variable, modelCode]);

  return { state, error };
}

const ConventionHint: FC = () => (
  <p className="mt-2 text-xs text-slate-500">
    A relative values spec is a top-level dict like{" "}
    <code className="rounded bg-slate-100 px-1">
      {"{ items: [...], fn: {|a, b| [distA, distB]} }"}
    </code>{" "}
    or{" "}
    <code className="rounded bg-slate-100 px-1">
      {"{ values: { id: dist, ... } }"}
    </code>
    , with optional <code>title</code>, <code>clusters</code> and{" "}
    <code>recommendedUnit</code>.
  </p>
);

const SpecError: FC<{ name: string; message: string }> = ({
  name,
  message,
}) => (
  <div className="rounded-md border border-red-200 bg-red-50 p-4">
    <div className="text-sm font-medium text-red-800">
      <code>{name}</code> looks like a relative values spec, but it&apos;s
      invalid:
    </div>
    <pre
      className="mt-2 whitespace-pre-wrap text-sm text-red-700"
      // Reported by `squiggle-studio render`.
      data-studio-error=""
    >
      {message}
    </pre>
    <ConventionHint />
  </div>
);

const Dashboard: FC<{
  context: StudioViewContext;
  runOutput: StudioRunOutput;
  found: RelativeValuesExport;
  picker: React.ReactNode;
  tab: RelativeValuesTab;
  onTabChange: (tab: RelativeValuesTab) => void;
}> = ({ context, runOutput, found, picker, tab, onTabChange }) => {
  const spec = found.spec.ok ? found.spec.value : undefined;
  const modelCode = runOutput.output.module.code;
  const { state, error } = useEvaluator(
    spec,
    runOutput.project,
    found.name,
    modelCode
  );

  if (!found.spec.ok) {
    return (
      <div className="flex flex-col gap-4">
        {picker}
        <SpecError name={found.name} message={found.spec.value} />
        {!runOutput.isStale && <span data-studio-ready="1" hidden />}
      </div>
    );
  }
  if (error !== undefined) {
    return (
      <div className="flex flex-col gap-4">
        {picker}
        <SpecError name={found.name} message={error} />
        {!runOutput.isStale && <span data-studio-ready="1" hidden />}
      </div>
    );
  }
  if (!state) {
    return <RefreshIcon className="animate-spin text-slate-400" size={20} />;
  }

  return (
    <>
      {state.spec === spec && !runOutput.isStale && (
        // Marker for `squiggle-studio render`: the dashboard shows this run.
        <span data-studio-ready="1" hidden />
      )}
      <RelativeValuesDashboard
        definition={state.spec.definition}
        evaluator={state.evaluator}
        tab={tab}
        onTabChange={onTabChange}
        header={
          <div className="flex items-center gap-3">
            <div className="font-semibold text-slate-700">
              {state.spec.definition.title}
            </div>
            {picker}
          </div>
        }
        linker={context.linker}
        sourceId={runOutput.sourceId}
      />
    </>
  );
};

export const RelativeValuesView: FC<{ context: StudioViewContext }> = ({
  context,
}) => {
  const { runOutput } = context;
  const [uiState, updateUiState] = useUiState(context.filePath);

  const found = useMemo(
    () => (runOutput ? getRelativeValuesExports(runOutput.output) : []),
    [runOutput]
  );

  if (!runOutput) {
    return (
      <div className="grid h-full place-items-center">
        <RefreshIcon className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  // `ready`: marker for `squiggle-studio render`. The dashboard sets its own
  // marker once its evaluator is ready.
  const wrap = (children: React.ReactNode, ready = false) => (
    <div
      className={context.embed ? "p-4" : "h-full overflow-auto p-4"}
      data-studio-ready={ready && !runOutput.isStale ? "1" : undefined}
    >
      {children}
    </div>
  );

  const result = runOutput.output.result;
  if (!result.ok) {
    return wrap(
      <div className="flex flex-col gap-2">
        <div className="text-sm text-slate-600">
          The model failed to run, so relative values can&apos;t be shown.
        </div>
        <SquiggleErrorAlert error={result.value.errors[0]} />
        <pre data-studio-error="" className="hidden">
          {result.value.errors.map((e) => e.toString()).join("\n")}
        </pre>
      </div>,
      true
    );
  }

  if (found.length === 0) {
    return wrap(
      <div className="text-sm text-slate-600">
        No relative values specs found in this file.
        <ConventionHint />
      </div>,
      true
    );
  }

  const preferred = context.variable ?? uiState.variable;
  const selected = found.find((f) => f.name === preferred) ?? found[0];

  const picker =
    found.length > 1 ? (
      <select
        className="rounded border border-slate-300 py-0.5 pl-2 pr-8 text-sm text-slate-700"
        aria-label="Relative values variable"
        value={selected.name}
        onChange={(e) => updateUiState({ variable: e.target.value })}
      >
        {found.map((f) => (
          <option key={f.name} value={f.name}>
            {f.name}
            {f.spec.ok ? "" : " (invalid)"}
          </option>
        ))}
      </select>
    ) : null;

  return wrap(
    <Dashboard
      // A fresh evaluator state per variable.
      key={selected.name}
      context={context}
      runOutput={runOutput}
      found={selected}
      picker={picker}
      tab={uiState.tab ?? "list"}
      onTabChange={(tab) => updateUiState({ tab })}
    />
  );
};
