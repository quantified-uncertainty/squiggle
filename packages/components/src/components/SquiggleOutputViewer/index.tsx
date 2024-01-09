import clsx from "clsx";
import { FC, forwardRef, useState } from "react";

import { result, SqError, SqValue } from "@quri/squiggle-lang";
import {
  Button,
  CodeBracketIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  TriangleIcon,
} from "@quri/ui";

import { SquiggleViewer } from "../../index.js";
import { SquiggleOutput } from "../../lib/hooks/useSquiggle.js";
import { getResultValue, getResultVariables } from "../../lib/utility.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { ErrorBoundary } from "../ErrorBoundary.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleErrorAlert } from "../SquiggleErrorAlert.js";
import { SquiggleViewerHandle } from "../SquiggleViewer/index.js";
import { Layout } from "./Layout.js";
import { RenderingIndicator } from "./RenderingIndicator.js";

const MenuItemTitle: FC<{ title: string; type: string | null }> = ({
  title,
  type,
}) => {
  const isEmpty = type === null;
  return (
    <div className="flex justify-between">
      <span className={clsx(isEmpty && "text-slate-400")}>{title}</span>
      {isEmpty ? (
        <span className="text-slate-300">Empty</span>
      ) : (
        <span className="text-blue-800">{type}</span>
      )}
    </div>
  );
};

type Props = {
  squiggleOutput: SquiggleOutput;
  isRunning: boolean;
  editor?: CodeEditorHandle;
} & PartialPlaygroundSettings;

/* Wrapper for SquiggleViewer that shows the rendering stats and isRunning state. */
export const SquiggleOutputViewer = forwardRef<SquiggleViewerHandle, Props>(
  ({ squiggleOutput, isRunning, editor, ...settings }, viewerRef) => {
    const resultItem = getResultValue(squiggleOutput);
    const resultVariables = getResultVariables(squiggleOutput);

    const hasResult = Boolean(resultItem?.ok);
    const variablesCount = resultVariables?.ok
      ? resultVariables.value.value.entries().length
      : 0;

    const [mode, setMode] = useState<"variables" | "result">(
      hasResult ? "result" : "variables"
    );

    let squiggleViewer: JSX.Element | null = null;
    if (squiggleOutput.code) {
      let usedResult: result<SqValue, SqError> | undefined;
      switch (mode) {
        case "result":
          usedResult = resultItem;
          break;
        case "variables":
          usedResult = resultVariables;
      }

      if (usedResult) {
        squiggleViewer = usedResult.ok ? (
          <div className="relative">
            {isRunning && (
              // `opacity-0 squiggle-semi-appear` would be better, but won't work reliably until we move Squiggle evaluation to Web Workers
              <div className="absolute z-10 inset-0 bg-white opacity-50" />
            )}
            <ErrorBoundary>
              <SquiggleViewer
                {...settings}
                ref={viewerRef}
                value={usedResult.value}
                editor={editor}
              />
            </ErrorBoundary>
          </div>
        ) : (
          <SquiggleErrorAlert error={usedResult.value} />
        );
      }
    }

    return (
      <Layout
        menu={
          <Dropdown
            render={({ close }) => (
              <DropdownMenu>
                <DropdownMenuActionItem
                  icon={CodeBracketIcon}
                  title={
                    <MenuItemTitle
                      title="Variables"
                      type={variablesCount ? `{}${variablesCount}` : null}
                    />
                  }
                  onClick={() => {
                    setMode("variables");
                    close();
                  }}
                />
                <DropdownMenuActionItem
                  icon={CodeBracketIcon}
                  title={
                    <MenuItemTitle
                      title="Result"
                      type={hasResult ? "" : null}
                    />
                  }
                  onClick={() => {
                    setMode("result");
                    close();
                  }}
                />
              </DropdownMenu>
            )}
          >
            <Button size="small">
              <div className="flex items-center space-x-1.5">
                <span>{mode === "variables" ? "Variables" : "Result"}</span>
                <TriangleIcon className="rotate-180 text-slate-400" size={10} />
              </div>
            </Button>
          </Dropdown>
        }
        indicator={
          <RenderingIndicator isRunning={isRunning} output={squiggleOutput} />
        }
        viewer={squiggleViewer}
      />
    );
  }
);
SquiggleOutputViewer.displayName = "DynamicSquiggleViewer";
