import {
  ChartSquareBarIcon,
  CodeIcon,
  CogIcon,
  CurrencyDollarIcon,
  EyeIcon,
} from "@heroicons/react/solid/esm/index.js";
import { yupResolver } from "@hookform/resolvers/yup";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { UseFormRegister, useForm, useWatch } from "react-hook-form";
import * as yup from "yup";
import { useInitialWidth } from "../../lib/hooks/useInitialWidth.js";
import { useHeight } from "../../lib/hooks/useHeight.js";

import { Env } from "@quri/squiggle-lang";
import { Button, TextTooltip } from "@quri/ui";

import { useMaybeControlledValue, useSquiggle } from "../../lib/hooks/index.js";

import { getErrors, getValueToRender, isMac } from "../../lib/utility.js";
import { CodeEditor, CodeEditorHandle } from "../CodeEditor.js";
import {
  SquiggleViewer,
  SquiggleViewerProps,
} from "../SquiggleViewer/index.js";
import {
  PlaygroundSettingsForm,
  viewSettingsSchema,
  type PlaygroundSettings,
} from "../PlaygroundSettings.js";

import { SqProject } from "@quri/squiggle-lang";
import { ResizableBox } from "react-resizable";
import { RunControls } from "./RunControls/index.js";
import { useRunnerState } from "./RunControls/useRunnerState.js";

type PlaygroundProps = // Playground can be either controlled (`code`) or uncontrolled (`defaultCode` + `onCodeChange`)
  (
    | { code: string; defaultCode?: undefined }
    | { defaultCode?: string; code?: undefined }
  ) &
    (
      | {
          project: SqProject;
          continues?: string[];
        }
      | {}
    ) &
    Omit<SquiggleViewerProps, "result"> & {
      onCodeChange?(expr: string): void;
      /* When settings change */
      onSettingsChange?(settings: any): void;
      /** Should we show the editor? */
      showEditor?: boolean;
      /** Allows to inject extra buttons, e.g. share button on the website, or save button in Squiggle Hub */
      renderExtraControls?: () => ReactNode;
      showShareButton?: boolean;
      /** Height of the editor */
      height?: number;
    };

// Left panel ref is used for local settings modal positioning in ItemSettingsMenu.tsx
type PlaygroundContextShape = {
  getLeftPanelElement: () => HTMLDivElement | undefined;
};
export const PlaygroundContext = React.createContext<PlaygroundContextShape>({
  getLeftPanelElement: () => undefined,
});

export const SquigglePlayground: React.FC<PlaygroundProps> = (props) => {
  const {
    defaultCode = "",
    code: controlledCode,
    onCodeChange,
    onSettingsChange,
    renderExtraControls,
    height = 500,
    showEditor = true,
  } = props;
  const [code, setCode] = useMaybeControlledValue({
    value: controlledCode,
    defaultValue: defaultCode,
    onChange: onCodeChange,
  });
  const { ref: fullContainerRef, width: initialWidth } = useInitialWidth();

  const defaultValues: PlaygroundSettings = {
    ...viewSettingsSchema.getDefault(),
    ...Object.fromEntries(
      Object.entries(props).filter(([k, v]) => v !== undefined)
    ),
  };

  type Tab = "CODE" | "SETTINGS" | "view";

  const [selectedTab, setSelectedTab] = useState("CODE" as Tab);

  const { register, control } = useForm({
    resolver: yupResolver(viewSettingsSchema),
    defaultValues,
  });

  // react-hook-form types the result as Partial, but the result doesn't seem to be a Partial, so this should be ok
  const vars = useWatch({ control }) as PlaygroundSettings;

  useEffect(() => {
    onSettingsChange?.(vars);
  }, [vars, onSettingsChange]);

  const environment: Env = useMemo(
    () => ({
      sampleCount: Number(vars.renderingSettings.sampleCount),
      xyPointLength: Number(vars.renderingSettings.xyPointLength),
    }),
    [vars.renderingSettings.sampleCount, vars.renderingSettings.xyPointLength]
  );

  const runnerState = useRunnerState(code);

  const resultAndBindings = useSquiggle({
    ...props,
    code: runnerState.renderedCode,
    executionId: runnerState.executionId,
    environment,
  });

  const valueToRender = useMemo(
    () => getValueToRender(resultAndBindings),
    [resultAndBindings]
  );

  const squiggleChart =
    runnerState.renderedCode === "" ? null : (
      <div className="relative">
        {runnerState.isRunning ? (
          <div className="absolute inset-0 bg-white opacity-0 animate-semi-appear" />
        ) : null}
        <SquiggleViewer
          {...vars}
          enableLocalSettings={true}
          result={valueToRender}
        />
      </div>
    );

  const errors = getErrors(resultAndBindings.result);

  const editorRef = useRef<CodeEditorHandle>(null);

  const standardHeightStyle = (height) => ({ height, overflow: "auto" });
  const { ref: leftSideHeader, height: leftSideHeaderHeight } = useHeight();
  const { ref: rightSideHeader, height: rightSideHeaderHeight } = useHeight();
  const TOOLTIP_HEIGHT = 0; //sometimes 20. Not sure why this seems to change, it's frustrating.

  const leftPanelBody = leftSideHeaderHeight && (
    <>
      {selectedTab === "CODE" && (
        <div data-testid="squiggle-editor">
          <CodeEditor
            ref={editorRef}
            value={code}
            errors={errors}
            project={resultAndBindings.project}
            showGutter={true}
            height={height - leftSideHeaderHeight + TOOLTIP_HEIGHT}
            onChange={setCode}
            onSubmit={runnerState.run}
          />
        </div>
      )}
      {selectedTab === "SETTINGS" && (
        <div
          className="px-2 space-y-6"
          style={standardHeightStyle(
            height - leftSideHeaderHeight + TOOLTIP_HEIGHT
          )}
        >
          <div className="px-2 py-2">
            <div className="pb-4">
              <Button onClick={() => setSelectedTab("CODE")}> Back </Button>
            </div>
            <PlaygroundSettingsForm
              register={
                // This is dangerous, but doesn't cause any problems.
                // I tried to make `PlaygroundSettings` generic (to allow it to accept any extension of a settings schema), but it didn't work.
                register as unknown as UseFormRegister<
                  yup.InferType<typeof viewSettingsSchema>
                >
              }
            />
          </div>
        </div>
      )}
    </>
  );

  const leftPanelRef = useRef<HTMLDivElement | null>(null);

  const textClasses =
    "text-slate-800 text-sm px-2 py-2 cursor-pointer rounded-sm hover:bg-slate-200 select-none whitespace-nowrap";

  const leftPanelHeader = (
    <div
      className="flex justify-end mb-1 p-1 bg-slate-50 border-b border-slate-200 overflow-x-auto"
      ref={leftSideHeader}
    >
      <div className="mr-2 flex gap-1 items-center">
        <div
          className={textClasses}
          onClick={() =>
            selectedTab !== "SETTINGS"
              ? setSelectedTab("SETTINGS")
              : setSelectedTab("CODE")
          }
        >
          Settings
        </div>
        <TextTooltip text={isMac() ? "Option+Shift+f" : "Alt+Shift+f"}>
          <div className={textClasses} onClick={editorRef.current?.format}>
            Format Code
          </div>
        </TextTooltip>
        <RunControls {...runnerState} />
        {renderExtraControls?.()}
      </div>
    </div>
  );

  const showTime = (executionTime) =>
    executionTime > 1000
      ? `${(executionTime / 1000).toFixed(2)}s`
      : `${executionTime}ms`;

  const playgroundWithEditor = (
    <div className="flex flex-row">
      <ResizableBox
        className="h-full relative"
        width={initialWidth / 2}
        axis="x"
        resizeHandles={["e"]}
        handle={(_, ref) => (
          <div
            ref={ref}
            // we don't use react-resizable original styles, it's easier to style this manually
            className="absolute top-0 h-full bg-slate-200 hover:bg-blue-200 transition cursor-ew-resize"
            style={{ width: 3, right: -1 }}
          />
        )}
      >
        <div ref={leftPanelRef}>
          {leftPanelHeader}
          {leftPanelBody}
        </div>
      </ResizableBox>
      <div
        className="flex-1 overflow-y-auto" //The overflow seems needed, it can't just be in the sub divs.
        data-testid="playground-result"
      >
        <div
          className="flex mb-1 p-2 overflow-y-auto justify-end text-slate-400 text-sm whitespace-nowrap"
          ref={rightSideHeader}
        >
          {runnerState.isRunning
            ? "rendering..."
            : `render #${runnerState.executionId} in ${showTime(
                runnerState.executionTime
              )}`}
        </div>
        <div
          style={standardHeightStyle(height - rightSideHeaderHeight)}
          className="p-2"
        >
          {squiggleChart}
        </div>
      </div>
    </div>
  );

  const getLeftPanelElement = useCallback(() => {
    return leftPanelRef.current ?? undefined;
  }, []);

  return (
    <PlaygroundContext.Provider value={{ getLeftPanelElement }}>
      <div
        ref={fullContainerRef}
        style={{
          minHeight: 200 /* important if editor is hidden */,
        }}
      >
        {showEditor && playgroundWithEditor}
        {!showEditor && (
          <div style={standardHeightStyle(rightSideHeaderHeight)}>
            {" "}
            {squiggleChart}
          </div>
        )}
      </div>
    </PlaygroundContext.Provider>
  );
};
