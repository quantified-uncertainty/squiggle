import { FC, forwardRef, ReactNode, useState } from "react";

import { result, SqError, SqValue, SqValuePath } from "@quri/squiggle-lang";
import {
  Button,
  CodeBracketIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
} from "@quri/ui";

import { SquiggleViewer } from "../index.js";
import { SquiggleOutput } from "../lib/hooks/useSquiggle.js";
import { getResultValue, getResultVariables } from "../lib/utility.js";
import { CodeEditorHandle } from "./CodeEditor/index.js";
import { ErrorBoundary } from "./ErrorBoundary.js";
import { PartialPlaygroundSettings } from "./PlaygroundSettings.js";
import { SquiggleViewerHandle } from "./SquiggleViewer/index.js";

const DynamicSquiggleViewerLayout: FC<{
  viewer: ReactNode;
  menu: ReactNode;
  indicator: string;
}> = ({ viewer, menu, indicator }) => {
  return (
    // `flex flex-col` helps to fit this in playground right panel and doesn't hurt otherwise
    <div className="flex flex-col overflow-y-auto">
      <div className="flex justify-between items-center px-2 h-8 mb-1">
        {menu}
        <div className="px-2 text-zinc-400 text-sm whitespace-nowrap">
          {indicator}
        </div>
      </div>
      <div
        className="flex-1 overflow-auto px-2 pb-1"
        data-testid="dynamic-viewer-result"
      >
        {viewer}
      </div>
    </div>
  );
};

type Props = {
  squiggleOutput: SquiggleOutput;
  isRunning: boolean;
  editor?: CodeEditorHandle;
  rootPathOverride?: SqValuePath;
} & PartialPlaygroundSettings;

/* Wrapper for SquiggleViewer that shows the rendering stats and isRunning state. */
export const DynamicSquiggleViewer = forwardRef<SquiggleViewerHandle, Props>(
  (
    { squiggleOutput, isRunning, editor, rootPathOverride, ...settings },
    viewerRef
  ) => {
    const resultItem = getResultValue(squiggleOutput);
    const resultVariables = getResultVariables(squiggleOutput);

    const hasResult = Boolean(resultItem?.ok);
    // const hasVariables =
    //   resultVariables.ok &&
    //   nonHiddenDictEntries(resultVariables.value.value).length > 0;

    const [mode, setMode] = useState<"variables" | "result">(
      hasResult ? "result" : "variables"
    );

    let squiggleViewer: JSX.Element | null = null;
    if (squiggleOutput.code) {
      let usedValue: result<SqValue, SqError> | undefined;
      switch (mode) {
        case "result":
          usedValue = resultItem;
          break;
        case "variables":
          usedValue = resultVariables;
      }
      squiggleViewer = (
        <div className="relative">
          {isRunning && (
            // `opacity-0 squiggle-semi-appear` would be better, but won't work reliably until we move Squiggle evaluation to Web Workers
            <div className="absolute z-10 inset-0 bg-white opacity-50" />
          )}
          <ErrorBoundary>
            <SquiggleViewer
              {...settings}
              ref={viewerRef}
              value={usedValue}
              editor={editor}
              rootPathOverride={rootPathOverride}
            />
          </ErrorBoundary>
        </div>
      );
    }

    const showTime = (executionTime: number) =>
      executionTime > 1000
        ? `${(executionTime / 1000).toFixed(2)}s`
        : `${executionTime}ms`;

    return (
      <DynamicSquiggleViewerLayout
        menu={
          <Dropdown
            render={({ close }) => (
              <DropdownMenu>
                <DropdownMenuActionItem
                  icon={CodeBracketIcon}
                  title={
                    "Variables" +
                    (resultVariables?.ok
                      ? ` (${resultVariables.value.value.entries().length})`
                      : "")
                  }
                  onClick={() => {
                    setMode("variables");
                    close();
                  }}
                />
                <DropdownMenuActionItem
                  icon={CodeBracketIcon}
                  title={"Result" + (hasResult ? "" : " (empty)")}
                  onClick={() => {
                    setMode("result");
                    close();
                  }}
                />
              </DropdownMenu>
            )}
          >
            <Button size="small">
              {mode === "variables" ? "Variables" : "Result"}
            </Button>
          </Dropdown>
        }
        indicator={
          isRunning
            ? "rendering..."
            : squiggleOutput
            ? `render #${squiggleOutput.executionId} in ${showTime(
                squiggleOutput.executionTime
              )}`
            : ""
        }
        viewer={squiggleViewer}
      />
    );
  }
);
DynamicSquiggleViewer.displayName = "DynamicSquiggleViewer";
