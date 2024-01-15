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
import {
  getResultImports,
  getResultExports,
  getResultValue,
  getResultVariables,
} from "../../lib/utility.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { ErrorBoundary } from "../ErrorBoundary.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleErrorAlert } from "../SquiggleErrorAlert.js";
import { SquiggleViewerHandle } from "../SquiggleViewer/index.js";
import { ViewerProvider } from "../SquiggleViewer/ViewerProvider.js";
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
    const resultImports = getResultImports(squiggleOutput);
    const resultExports = getResultExports(squiggleOutput);

    const hasResult = Boolean(resultItem?.ok);
    const variablesCount = resultVariables?.ok
      ? resultVariables.value.value.entries().length
      : 0;
    const importsCount = resultImports?.ok
      ? resultImports.value.value.entries().length
      : 0;
    const exportsCount = resultExports?.ok
      ? resultExports.value.value.entries().length
      : 0;

    const [mode, setMode] = useState<
      "imports" | "exports" | "variables" | "result"
    >(hasResult ? "result" : exportsCount > 0 ? "exports" : "variables");

    let squiggleViewer: JSX.Element | null = null;
    if (squiggleOutput.code) {
      let usedResult: result<SqValue, SqError> | undefined;
      switch (mode) {
        case "result":
          usedResult = resultItem;
          break;
        case "variables":
          usedResult = resultVariables;
          break;
        case "imports":
          usedResult = resultImports;
          break;
        case "exports":
          usedResult = resultExports;
      }

      if (usedResult) {
        // Only fails when mode = result and resultItem is undefined
        squiggleViewer = usedResult.ok ? (
          <div className="relative">
            {isRunning && (
              // `opacity-0 squiggle-semi-appear` would be better, but won't work reliably until we move Squiggle evaluation to Web Workers
              <div className="absolute z-10 inset-0 bg-white opacity-50" />
            )}
            <ErrorBoundary>
              {/* we don't pass settings or editor here because they're already configured in `<ViewerProvider>`; hopefully `<SquiggleViewer>` itself won't need to rely on settings, otherwise things might break */}
              <SquiggleViewer ref={viewerRef} value={usedResult.value} />
            </ErrorBoundary>
          </div>
        ) : (
          <SquiggleErrorAlert error={usedResult.value} />
        );
      }
    }

    return (
      <ViewerProvider partialPlaygroundSettings={settings} editor={editor}>
        <Layout
          menu={
            <Dropdown
              render={({ close }) => (
                <DropdownMenu>
                  {Boolean(importsCount) && (
                    <DropdownMenuActionItem
                      icon={CodeBracketIcon}
                      title={
                        <MenuItemTitle
                          title="Imports"
                          type={importsCount ? `{}${importsCount}` : null}
                        />
                      }
                      onClick={() => {
                        setMode("imports");
                        close();
                      }}
                    />
                  )}
                  {Boolean(variablesCount) && (
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
                  )}
                  {Boolean(exportsCount) && (
                    <DropdownMenuActionItem
                      icon={CodeBracketIcon}
                      title={
                        <MenuItemTitle
                          title="Exports"
                          type={exportsCount ? `{}${exportsCount}` : null}
                        />
                      }
                      onClick={() => {
                        setMode("exports");
                        close();
                      }}
                    />
                  )}
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
                  <span>
                    {
                      {
                        imports: "Imports",
                        exports: "Exports",
                        variables: "Variables",
                        result: "Result",
                      }[mode]
                    }
                  </span>
                  <TriangleIcon
                    className="rotate-180 text-slate-400"
                    size={10}
                  />
                </div>
              </Button>
            </Dropdown>
          }
          indicator={
            <RenderingIndicator isRunning={isRunning} output={squiggleOutput} />
          }
          viewer={squiggleViewer}
        />
      </ViewerProvider>
    );
  }
);
SquiggleOutputViewer.displayName = "DynamicSquiggleViewer";
