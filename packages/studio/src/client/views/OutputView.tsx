import { FC } from "react";

import {
  ProjectContext,
  SquiggleErrorAlert,
  ViewerWithMenuBar,
} from "@quri/squiggle-components";
import { SqValuePath, SqValuePathEdge } from "@quri/squiggle-lang";
import { RefreshIcon } from "@quri/ui";

import type { StudioRunOutput, StudioViewContext } from "./types.js";

function errorText(runOutput: StudioRunOutput): string | undefined {
  const result = runOutput.output.result;
  if (result.ok) return undefined;
  return result.value.errors.map((e) => e.toString()).join("\n");
}

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
      playgroundSettings={{}}
      randomizeSeed={undefined}
      showMenu={false}
      defaultTab={{
        tag: "CustomVisibleRootPath",
        visibleRootPath: new SqValuePath({
          root: "bindings",
          edges: [SqValuePathEdge.fromKey(variable)],
        }),
      }}
    />
  );
};

export const OutputView: FC<{ context: StudioViewContext }> = ({ context }) => {
  const { runOutput } = context;
  if (!runOutput) {
    return (
      <div className="grid h-full place-items-center">
        <RefreshIcon className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }
  const error = errorText(runOutput);
  return (
    <ProjectContext.Provider
      value={{
        sourceId: runOutput.sourceId,
        onOpenExport: (sourceId) => {
          if (!sourceId.startsWith("hub:")) context.openFile(sourceId);
        },
      }}
    >
      <div
        // In embed mode the page grows with the content, so that
        // full-page screenshots capture everything.
        className={context.embed ? "" : "h-full overflow-auto"}
        // Markers for `squiggle-studio render` (headless screenshots).
        data-studio-ready={runOutput.isStale ? "0" : "1"}
      >
        {error !== undefined && (
          <pre data-studio-error="" className="hidden">
            {error}
          </pre>
        )}
        {context.variable ? (
          <div className="p-2">
            <SingleVariable runOutput={runOutput} variable={context.variable} />
          </div>
        ) : (
          <div className={context.embed ? "" : "mx-auto h-full max-w-5xl"}>
            <ViewerWithMenuBar
              simulation={runOutput.simulation}
              playgroundSettings={{}}
              randomizeSeed={undefined}
              showMenu={!context.embed}
              xPadding={4}
            />
          </div>
        )}
      </div>
    </ProjectContext.Provider>
  );
};
