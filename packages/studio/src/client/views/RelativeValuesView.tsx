import {
  FC,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { z } from "zod";

import { SquiggleErrorAlert } from "@quri/squiggle-components";
import type { SqProject } from "@quri/squiggle-lang";
import {
  ModelEvaluator,
  RelativeValuesDashboard,
  type RelativeValuesSpec,
} from "@quri/squiggle-relative-values";
import { RefreshIcon, useToast } from "@quri/ui";

import { TID } from "../../shared/testIds.js";
import { useContextKeys } from "../commands/context.js";
import { registerFocuser } from "../commands/focus.js";
import { useCommand } from "../commands/registry.js";
import { useReportBusy } from "../lib/idle.js";
import { updateViewState } from "../lib/navigation.js";
import { getRvMatrixCsv, setRvLiveSource } from "../lib/rvMatrix.js";
import { WorkspaceContext } from "../lib/workspaceTypes.js";
import { RV_TOOLBAR_SELECTOR, RvToolbar } from "./rv/RvToolbar.js";
import {
  DEFAULT_RV_TAB,
  formerSpecs,
  getPairCache,
  getRelativeValuesExports,
  hasRelativeValues,
  rvTabSchema,
  selectSpec,
  useRvFileState,
} from "./rv/rvState.js";
import { semanticKey } from "./rv/semanticKey.js";
import type { StudioView, StudioViewContext } from "./types.js";

export { getRelativeValuesExports, hasRelativeValues };

// While the code changes, the dashboard keeps its evaluator and swaps to the
// new one only after this long without changes, or on save (QA #15).
export const RV_SWAP_DELAY_MS = 600;

const setTabArgsSchema = z.object({ tab: rvTabSchema });

// ── Evaluator swapping ──────────────────────────────────────────────────────

type Latest = {
  variable: string;
  spec: RelativeValuesSpec;
  key: string; // semantic key of the run's module
  project: SqProject;
  executionId: number;
};

type Shown = Omit<Latest, "spec" | "executionId"> & {
  spec: RelativeValuesSpec;
  evaluator: ModelEvaluator;
  executionId: number; // the latest run the shown evaluator stands for
};

// The evaluator the dashboard shows for the latest run's spec. A run whose
// module means the same as the shown one (same semantic key: a comment or
// whitespace edit) keeps the shown evaluator and its computed pairs. A
// different one swaps after RV_SWAP_DELAY_MS without further runs, or at once
// when the run is of the saved file, a new spec is picked or nothing is
// shown yet. Until then the previous dashboard stays (with its sorting and
// filters), and the view isn't ready.
function useSwappedEvaluator(latest: Latest | undefined, saved: boolean) {
  const [shown, setShown] = useState<Shown | undefined>();
  const [error, setError] = useState<
    { executionId: number; variable: string; message: string } | undefined
  >();
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    if (!latest) return;
    const current = shownRef.current;
    if (
      current &&
      current.variable === latest.variable &&
      current.key === latest.key &&
      current.project === latest.project
    ) {
      if (current.executionId !== latest.executionId) {
        setShown({ ...current, executionId: latest.executionId });
      }
      setError(undefined);
      return;
    }
    let cancelled = false;
    const build = () => {
      ModelEvaluator.fromSpec(latest.spec, {
        cache: getPairCache(latest.project, latest.variable, latest.key),
      }).then(
        (result) => {
          if (cancelled) return;
          if (result.ok) {
            setShown({ ...latest, evaluator: result.value });
            setError(undefined);
          } else {
            setError({
              executionId: latest.executionId,
              variable: latest.variable,
              message: result.value,
            });
          }
        },
        (e: unknown) => {
          if (cancelled) return;
          setError({
            executionId: latest.executionId,
            variable: latest.variable,
            message: e instanceof Error ? e.message : String(e),
          });
        }
      );
    };
    const now =
      !current ||
      current.variable !== latest.variable ||
      current.project !== latest.project ||
      saved;
    const timer = now ? undefined : setTimeout(build, RV_SWAP_DELAY_MS);
    if (now) build();
    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [latest, saved]);

  const currentError =
    error &&
    latest &&
    error.executionId === latest.executionId &&
    error.variable === latest.variable
      ? error.message
      : undefined;
  const pending =
    latest !== undefined &&
    currentError === undefined &&
    (shown === undefined ||
      shown.executionId !== latest.executionId ||
      shown.variable !== latest.variable);
  return { shown, pending, error: currentError };
}

// ── Pieces ──────────────────────────────────────────────────────────────────

const ConventionHint: FC = () => (
  <p className="mt-2 text-xs text-slate-600">
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
  <div
    className="max-w-3xl rounded-md border border-red-200 bg-red-50 p-4"
    data-testid={TID.rvError}
  >
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

// `data-studio-ready` for `render`, the e2e harness and whenIdle: "1" once the
// view shows the latest run.
const ReadyMarker: FC<{ ready: boolean }> = ({ ready }) => (
  <span data-studio-ready={ready ? "1" : "0"} hidden />
);

// ── The view ────────────────────────────────────────────────────────────────

export const RelativeValuesView: FC<{ context: StudioViewContext }> = ({
  context,
}) => {
  const workspace = useContext(WorkspaceContext);
  const root = workspace?.rootInfo?.root;
  const { runOutput, filePath, embed, initial } = context;
  const toast = useToast();
  const [state, update] = useRvFileState(root, filePath, { initial, embed });
  const tab = state.tab ?? DEFAULT_RV_TAB;

  const found = useMemo(
    () => (runOutput ? getRelativeValuesExports(runOutput.output) : []),
    [runOutput]
  );
  const runOk = runOutput?.output.result.ok ?? false;
  const selected = selectSpec(found, state.variable);
  // In embed mode (`render --variable`) the URL's spec must exist (#47).
  const unknownVariable =
    embed &&
    runOk &&
    found.length > 0 &&
    state.variable !== undefined &&
    !found.some((f) => f.name === state.variable);

  const latest = useMemo((): Latest | undefined => {
    if (!runOutput || !runOk || !selected?.spec.ok || unknownVariable) {
      return undefined;
    }
    return {
      variable: selected.name,
      spec: selected.spec.value,
      key: semanticKey(runOutput.output.module),
      project: runOutput.project,
      executionId: runOutput.executionId,
    };
  }, [runOutput, runOk, selected, unknownVariable]);

  // The run is of the file on disk (saved, or changed by an agent): swap the
  // evaluator at once.
  const file = workspace?.files[filePath];
  const saved =
    !file || !runOutput || runOutput.output.module.code === file.disk;
  const { shown, pending, error } = useSwappedEvaluator(latest, saved);
  const current =
    shown && shown.variable === selected?.name ? shown : undefined;
  const rvReady = !!current && !error && !unknownVariable;

  useReportBusy(`rv:${filePath}`, !runOutput || pending);

  // Context keys (§4.4). `squiggle.view` is FileWorkspace's (WP5); it's
  // published here too while this view is mounted, with the same value.
  useContextKeys({
    "squiggle.view": "relative-values",
    "squiggle.rvTab": tab,
    rvReady,
  });

  useCommand("squiggle.rv.setTab", (args) => {
    const parsed = setTabArgsSchema.safeParse(args);
    if (!parsed.success) {
      throw new Error(
        'squiggle.rv.setTab needs {tab: "list" | "grid" | "plot"}'
      );
    }
    update({ tab: parsed.data.tab });
  });

  useCommand(
    "squiggle.rv.copyCsv",
    async () => {
      const name = selected?.name;
      const csv = await getRvMatrixCsv({ variable: name });
      // Missing on non-secure origins (`--allow-network` over plain http).
      if (!navigator.clipboard) {
        throw new Error(
          "The clipboard isn't available on this address; use `squiggle-studio rv --format csv` instead"
        );
      }
      await navigator.clipboard.writeText(csv);
      toast(`Copied ${name ?? "relative values"} as CSV`, "confirmation");
    },
    { enabled: rvReady }
  );

  // F6 / focusing the view lands on the toolbar's tabs (§4.5). Registered in
  // an effect, after the workspace's own view focuser, so it wins while this
  // view is mounted.
  useEffect(
    () =>
      registerFocuser("view", () => {
        const button = document.querySelector<HTMLElement>(
          `${RV_TOOLBAR_SELECTOR} [role="radio"][aria-checked="true"]`
        );
        if (!button) return false;
        button.focus();
        return true;
      }),
    []
  );

  // The address bar mirrors the tab and spec (replaceState), and drops them
  // when another view is shown.
  const selectedName = selected?.name;
  useEffect(() => {
    if (!embed) updateViewState({ tab, variable: selectedName });
  }, [embed, tab, selectedName]);
  useEffect(
    () => () => {
      if (!embed) updateViewState({ tab: undefined, variable: undefined });
    },
    [embed]
  );

  // window.squiggleStudio.getRvMatrix() reuses this evaluator.
  useEffect(() => {
    if (!runOutput) return;
    return setRvLiveSource({
      path: filePath,
      output: runOutput.output,
      project: runOutput.project,
      variable: selectedName,
      evaluator: current
        ? {
            variable: current.variable,
            key: current.key,
            evaluator: current.evaluator,
          }
        : undefined,
    });
  }, [filePath, runOutput, selectedName, current]);

  const wrap = (children: ReactNode) => (
    <div
      data-testid={TID.rvView}
      className={embed ? "bg-white p-4" : "h-full overflow-auto bg-white p-4"}
    >
      {children}
    </div>
  );

  if (!runOutput) {
    return wrap(
      <div className="grid h-full place-items-center">
        <ReadyMarker ready={false} />
        <RefreshIcon className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }
  const notStale = !runOutput.isStale;

  const result = runOutput.output.result;
  if (!result.ok) {
    return wrap(
      <div className="flex flex-col gap-2" data-testid={TID.rvError}>
        <ReadyMarker ready={notStale} />
        <div className="text-sm text-slate-600">
          The model failed to run, so relative values can&apos;t be shown.
        </div>
        <SquiggleErrorAlert error={result.value.errors[0]} />
        <pre data-studio-error="" className="hidden">
          {result.value.errors.map((e) => e.toString()).join("\n")}
        </pre>
      </div>
    );
  }

  if (found.length === 0 || !selected) {
    const former = formerSpecs(filePath, runOutput.output);
    return wrap(
      <div className="text-sm text-slate-600" data-testid={TID.rvError}>
        <ReadyMarker ready={notStale} />
        {former.length > 0 ? (
          <>
            <code>{former.join(", ")}</code> {former.length > 1 ? "are" : "is"}{" "}
            no longer a relative values spec.
          </>
        ) : (
          <span data-studio-error={embed ? "" : undefined}>
            No relative values specs found in this file.
          </span>
        )}
        <ConventionHint />
      </div>
    );
  }

  if (unknownVariable) {
    return wrap(
      <div
        className="text-sm text-red-700"
        data-testid={TID.rvError}
        data-studio-error=""
      >
        No relative values spec named <code>{state.variable}</code> in this
        file; its specs are {found.map((f) => f.name).join(", ")}.
      </div>
    );
  }

  if (!selected.spec.ok || error !== undefined) {
    return wrap(
      <>
        <ReadyMarker ready={notStale} />
        <SpecError
          name={selected.name}
          message={selected.spec.ok ? (error ?? "") : selected.spec.value}
        />
      </>
    );
  }

  if (!current) {
    return wrap(
      <div className="grid h-full place-items-center">
        <ReadyMarker ready={false} />
        <RefreshIcon className="animate-spin text-slate-400" size={20} />
      </div>
    );
  }

  return wrap(
    <>
      <ReadyMarker ready={notStale && !pending} />
      <RelativeValuesDashboard
        // Fresh sorting and filters per spec.
        key={current.variable}
        definition={current.spec.definition}
        evaluator={current.evaluator}
        tab={tab}
        onTabChange={(next) => update({ tab: next })}
        showTabs={false}
        // The title only in embed mode (`render`), which has no editor header.
        header={embed ? undefined : null}
      />
    </>
  );
};

// Shown for files with a top-level relative values spec (see
// @quri/squiggle-relative-values). Its List / Grid / Plot tabs and spec
// picker are in the editor header.
export const relativeValuesView: StudioView = {
  id: "relative-values",
  label: "Relative values",
  isAvailable: ({ filePath, runOutput }) =>
    hasRelativeValues(filePath, runOutput),
  render: (context) => <RelativeValuesView context={context} />,
  renderToolbar: (context) => <RvToolbar context={context} />,
};
