import { forwardRef } from "react";

import { SquiggleViewer } from "../index.js";
import { SquiggleOutput } from "../lib/hooks/useSquiggle.js";
import { getResultVariables, getResultValue } from "../lib/utility.js";
import { CodeEditorHandle } from "./CodeEditor.js";
import { PartialPlaygroundSettings } from "./PlaygroundSettings.js";
import { SquiggleViewerHandle } from "./SquiggleViewer/index.js";
import { ErrorBoundary } from "./ErrorBoundary.js";

type Props = {
  squiggleOutput: SquiggleOutput | undefined;
  isRunning: boolean;
  showHeader?: boolean;
  localSettingsEnabled?: boolean;
  editor?: CodeEditorHandle;
} & PartialPlaygroundSettings;

/* Wrapper for SquiggleViewer that shows the rendering stats and isRunning state. */
export const DynamicSquiggleViewer = forwardRef<SquiggleViewerHandle, Props>(
  function DynamicSquiggleViewer(
    {
      squiggleOutput,
      isRunning,
      showHeader = true,
      localSettingsEnabled,
      editor,
      ...settings
    },
    viewerRef
  ) {
    const squiggleViewer = squiggleOutput?.code ? (
      <div className="relative">
        {isRunning && (
          // `opacity-0 squiggle-semi-appear` would be better, but won't work reliably until we move Squiggle evaluation to Web Workers
          <div className="absolute z-10 inset-0 bg-white opacity-50" />
        )}
        <ErrorBoundary>
          <SquiggleViewer
            {...settings}
            ref={viewerRef}
            localSettingsEnabled={localSettingsEnabled}
            resultVariables={getResultVariables(squiggleOutput)}
            resultItem={getResultValue(squiggleOutput)}
            editor={editor}
          />
        </ErrorBoundary>
      </div>
    ) : null;

    const showTime = (executionTime: number) =>
      executionTime > 1000
        ? `${(executionTime / 1000).toFixed(2)}s`
        : `${executionTime}ms`;

    return (
      // `flex flex-col` helps to fit this in playground right panel and doesn't hurt otherwise
      <div className="flex flex-col overflow-y-auto">
        {showHeader && (
          <div className="mb-1 h-8 p-2 flex justify-end text-zinc-400 text-sm whitespace-nowrap">
            {isRunning
              ? "rendering..."
              : squiggleOutput
              ? `render #${squiggleOutput.executionId} in ${showTime(
                  squiggleOutput.executionTime
                )}`
              : null}
          </div>
        )}
        <div
          className="flex-1 overflow-auto p-2"
          data-testid="dynamic-viewer-result"
        >
          {squiggleViewer}
        </div>
      </div>
    );
  }
);
