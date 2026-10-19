import { clsx } from "clsx";
import { FC, useRef, useState } from "react";
import { z } from "zod";

import {
  ProjectContext,
  SquiggleErrorAlert,
  ViewerWithMenuBar,
} from "@quri/squiggle-components";
import { SqValue, SqValuePath, SqValuePathEdge } from "@quri/squiggle-lang";
import { RefreshIcon } from "@quri/ui";

import { readStorage, writeStorage } from "../lib/storage.js";
import type { StudioRunOutput, StudioViewContext } from "./types.js";

type Layout = "cards" | "list";

const layoutKey = "squiggle-studio:output-layout";
const layoutSchema = z.enum(["cards", "list"]);

// Settings for charts inside cards: shorter than the playground default, so
// that a typical model fits on one screen.
const cardSettings = { chartHeight: 35 }; // zoomed-in charts render at 4x this
const listSettings = {};

function errorText(runOutput: StudioRunOutput): string | undefined {
  const result = runOutput.output.result;
  if (result.ok) return undefined;
  return result.value.errors.map((e) => e.toString()).join("\n");
}

function bindingPath(name: string): SqValuePath {
  return new SqValuePath({
    root: "bindings",
    edges: [SqValuePathEdge.fromKey(name)],
  });
}

const resultPath = new SqValuePath({ root: "result", edges: [] });

// One value, zoomed in, without the viewer's toolbar.
const ValueCard: FC<{
  runOutput: StudioRunOutput;
  path: SqValuePath;
  wide?: boolean;
}> = ({ runOutput, path, wide }) => (
  <div
    className={clsx(
      "min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white py-2 shadow-sm",
      wide && "col-span-full"
    )}
  >
    <div className="max-h-[32rem] overflow-auto">
      <ViewerWithMenuBar
        simulation={runOutput.simulation}
        playgroundSettings={cardSettings}
        randomizeSeed={undefined}
        showToolbar={false}
        defaultTab={{ tag: "CustomVisibleRootPath", visibleRootPath: path }}
      />
    </div>
  </div>
);

// Functions often can't be plotted (e.g. when they take a distribution), so
// their cards start compact and show the plot on demand.
const FunctionCard: FC<{
  runOutput: StudioRunOutput;
  name: string;
  value: SqValue;
}> = ({ runOutput, name, value }) => {
  const [expanded, setExpanded] = useState(false);
  if (expanded) {
    return <ValueCard runOutput={runOutput} path={bindingPath(name)} />;
  }
  const doc = value.tags.doc();
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-baseline gap-2">
        <span className="truncate font-semibold text-slate-800">
          {value.tags.name() ?? name}
        </span>
        <code className="truncate text-sm text-slate-500">
          {value.toString()}
        </code>
        <button
          type="button"
          className="ml-auto shrink-0 text-xs font-medium text-slate-500 hover:text-slate-900"
          onClick={() => setExpanded(true)}
        >
          Show plot
        </button>
      </div>
      {doc && <p className="mt-1 text-sm text-slate-500">{doc}</p>}
    </div>
  );
};

const Cards: FC<{ runOutput: StudioRunOutput; embed: boolean }> = ({
  runOutput,
  embed,
}) => {
  const result = runOutput.output.result;
  if (!result.ok) return null;
  const { result: resultValue, bindings } = result.value;
  const entries = bindings
    .entries()
    .filter(([, value]) => !value.tags.hidden());
  const hasResult = resultValue.tag !== "Void";

  if (!entries.length && !hasResult) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        This model doesn&apos;t define any variables yet.
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "grid gap-3",
        embed
          ? "grid-cols-2 p-2"
          : "grid-cols-[repeat(auto-fill,minmax(22rem,1fr))] p-4"
      )}
    >
      {hasResult && (
        <ValueCard
          // Remount when a new run starts, so that each card's viewer picks
          // up the new output's initial state.
          key={`result:${runOutput.executionId}`}
          runOutput={runOutput}
          path={resultPath}
          wide
        />
      )}
      {entries.map(([name, value]) =>
        value.tag === "Lambda" && !embed ? (
          <FunctionCard
            key={`${name}:${runOutput.executionId}`}
            runOutput={runOutput}
            name={name}
            value={value}
          />
        ) : (
          <ValueCard
            key={`${name}:${runOutput.executionId}`}
            runOutput={runOutput}
            path={bindingPath(name)}
          />
        )
      )}
    </div>
  );
};

// Shows a single variable, zoomed in (as on Squiggle Hub's export pages).
const SingleVariable: FC<{ runOutput: StudioRunOutput; variable: string }> = ({
  runOutput,
  variable,
}) => {
  const bindings = runOutput.output.getBindings();
  if (!bindings.ok) {
    return <SquiggleErrorAlert error={bindings.value.errors[0]} />;
  }
  if (!bindings.value.get(variable)) {
    return (
      <div className="p-4 text-sm text-red-700">
        Variable <code>{variable}</code> is not defined.
      </div>
    );
  }
  return (
    <ViewerWithMenuBar
      simulation={runOutput.simulation}
      playgroundSettings={listSettings}
      randomizeSeed={undefined}
      showMenu={false}
      defaultTab={{
        tag: "CustomVisibleRootPath",
        visibleRootPath: bindingPath(variable),
      }}
    />
  );
};

const LayoutToggle: FC<{ layout: Layout; onChange: (l: Layout) => void }> = ({
  layout,
  onChange,
}) => (
  <div className="flex rounded-md bg-slate-100 p-0.5 text-xs font-medium">
    {(["cards", "list"] as const).map((l) => (
      <button
        key={l}
        type="button"
        className={clsx(
          "rounded px-2 py-0.5 capitalize",
          l === layout
            ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
            : "text-slate-500 hover:text-slate-800"
        )}
        onClick={() => onChange(l)}
      >
        {l}
      </button>
    ))}
  </div>
);

export const OutputView: FC<{ context: StudioViewContext }> = ({ context }) => {
  const { runOutput } = context;
  const [layout, setLayout] = useState<Layout>(
    () => readStorage(layoutKey, layoutSchema) ?? "cards"
  );

  // While the code is broken (e.g. halfway through an edit by an agent), keep
  // showing the last successful run, dimmed, under the error.
  const lastGoodRef = useRef<StudioRunOutput | undefined>(undefined);
  if (runOutput?.output.result.ok) {
    lastGoodRef.current = runOutput;
  }

  // Until the first run finishes after a remount, keep showing the last run.
  const current = runOutput ?? lastGoodRef.current;
  if (!current) {
    return (
      <div className="grid h-full place-items-center">
        <RefreshIcon className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  const error = errorText(current);
  const result = current.output.result;
  const shown = result.ok ? current : lastGoodRef.current;

  const changeLayout = (l: Layout) => {
    setLayout(l);
    writeStorage(layoutKey, l);
  };

  return (
    <ProjectContext.Provider
      value={{
        sourceId: current.sourceId,
        onOpenExport: (sourceId) => {
          if (!sourceId.startsWith("hub:")) context.openFile(sourceId);
        },
      }}
    >
      <div
        // In embed mode the page grows with the content, so that
        // full-page screenshots capture everything.
        className={clsx(
          "flex flex-col bg-slate-50",
          context.embed ? "" : "h-full"
        )}
        // Markers for `squiggle-studio render` (headless screenshots).
        data-studio-ready={current.isStale ? "0" : "1"}
      >
        {error !== undefined && (
          <pre data-studio-error="" className="hidden">
            {error}
          </pre>
        )}
        {!context.embed && !context.variable && (
          <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-1.5">
            <span className="text-xs text-slate-500">
              {current.isStale
                ? "Running…"
                : `Ran in ${current.output.executionTime} ms`}
            </span>
            <div className="ml-auto">
              <LayoutToggle layout={layout} onChange={changeLayout} />
            </div>
          </div>
        )}
        <div
          className={clsx("min-h-0 flex-1", !context.embed && "overflow-auto")}
        >
          {!result.ok && (
            <div className="px-4 pt-4">
              <SquiggleErrorAlert error={result.value.errors[0]} />
              {shown && (
                <p className="mt-2 text-xs text-slate-500">
                  Showing the last successful run.
                </p>
              )}
            </div>
          )}
          {context.variable ? (
            <div className="bg-white p-2">
              <SingleVariable runOutput={current} variable={context.variable} />
            </div>
          ) : shown ? (
            <div className={clsx(!result.ok && "opacity-50")}>
              {layout === "cards" || context.embed ? (
                <Cards runOutput={shown} embed={context.embed} />
              ) : (
                <div className="mx-auto max-w-5xl bg-white">
                  <ViewerWithMenuBar
                    simulation={shown.simulation}
                    playgroundSettings={listSettings}
                    randomizeSeed={undefined}
                    showMenu={true}
                    xPadding={4}
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </ProjectContext.Provider>
  );
};
