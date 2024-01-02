import clsx from "clsx";
import { FC, forwardRef, useState } from "react";

import { result, SqError, SqValue } from "@quri/squiggle-lang";
import {
  Button,
  CodeBracketIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
} from "@quri/ui";

import { SquiggleViewer } from "../../index.js";
import { SquiggleOutput } from "../../lib/hooks/useSquiggle.js";
import { getResultValue, getResultVariables } from "../../lib/utility.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { ErrorBoundary } from "../ErrorBoundary.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleViewerHandle } from "../SquiggleViewer/index.js";
import { Indicator } from "./Indicator.js";
import { Layout } from "./Layout.js";

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
            />
          </ErrorBoundary>
        </div>
      );
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
              {mode === "variables" ? "Variables" : "Result"}
            </Button>
          </Dropdown>
        }
        indicator={<Indicator isRunning={isRunning} output={squiggleOutput} />}
        viewer={squiggleViewer}
      />
    );
  }
);
SquiggleOutputViewer.displayName = "DynamicSquiggleViewer";
