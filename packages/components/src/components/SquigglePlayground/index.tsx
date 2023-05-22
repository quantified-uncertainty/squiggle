import {
  ChartSquareBarIcon,
  CodeIcon,
  CogIcon,
  CurrencyDollarIcon,
  EyeIcon,
} from "@heroicons/react/solid/esm/index.js";
import { yupResolver } from "@hookform/resolvers/yup";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { UseFormRegister, useForm, useWatch } from "react-hook-form";
import * as yup from "yup";

import { Env } from "@quri/squiggle-lang";
import { Button, StyledTab, TextTooltip } from "@quri/ui";

import { useMaybeControlledValue, useSquiggle } from "../../lib/hooks/index.js";

import { JsImports } from "../../lib/jsImports.js";
import { getErrors, getValueToRender, isMac } from "../../lib/utility.js";
import { CodeEditor, CodeEditorHandle } from "../CodeEditor.js";
import { SquiggleContainer } from "../SquiggleContainer.js";
import {
  SquiggleViewer,
  SquiggleViewerProps,
} from "../SquiggleViewer/index.js";
import { ViewSettingsForm, viewSettingsSchema } from "../ViewSettingsForm.js";

import { SqProject } from "@quri/squiggle-lang";
import { ImportSettingsForm } from "./ImportSettingsForm.js";
import { RunControls } from "./RunControls/index.js";
import { useRunnerState } from "./RunControls/useRunnerState.js";
import { ShareButton } from "./ShareButton.js";
import {
  EnvironmentSettingsForm,
  playgroundSettingsSchema,
  type PlaygroundFormFields,
} from "./playgroundSettings.js";

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
      /** Useful for playground on squiggle website, where we update the anchor link based on current code and settings */
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
    showShareButton = false,
    height = 500,
    showEditor = true,
  } = props;
  const [code, setCode] = useMaybeControlledValue({
    value: controlledCode,
    defaultValue: defaultCode,
    onChange: onCodeChange,
  });

  const [imports, setImports] = useState<JsImports>({});

  const defaultValues: PlaygroundFormFields = {
    ...playgroundSettingsSchema.getDefault(),
    ...Object.fromEntries(
      Object.entries(props).filter(([k, v]) => v !== undefined)
    ),
  };

  const { register, control } = useForm({
    resolver: yupResolver(playgroundSettingsSchema),
    defaultValues,
  });

  // react-hook-form types the result as Partial, but the result doesn't seem to be a Partial, so this should be ok
  const vars = useWatch({ control }) as PlaygroundFormFields;

  useEffect(() => {
    onSettingsChange?.(vars);
  }, [vars, onSettingsChange]);

  const environment: Env = useMemo(
    () => ({
      sampleCount: Number(vars.sampleCount),
      xyPointLength: Number(vars.xyPointLength),
    }),
    [vars.sampleCount, vars.xyPointLength]
  );

  const runnerState = useRunnerState(code);

  const resultAndBindings = useSquiggle({
    ...props,
    code: runnerState.renderedCode,
    executionId: runnerState.executionId,
    jsImports: imports,
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

  const firstTab = showEditor ? (
    <div className="border border-slate-200" data-testid="squiggle-editor">
      <CodeEditor
        ref={editorRef}
        value={code}
        errors={errors}
        project={resultAndBindings.project}
        showGutter={true}
        height={height}
        onChange={setCode}
        onSubmit={runnerState.run}
      />
    </div>
  ) : (
    squiggleChart
  );

  const tabs = (
    <StyledTab.Panels>
      <StyledTab.Panel>{firstTab}</StyledTab.Panel>
      <StyledTab.Panel>
        <EnvironmentSettingsForm register={register} />
      </StyledTab.Panel>
      <StyledTab.Panel>
        <ViewSettingsForm
          register={
            // This is dangerous, but doesn't cause any problems.
            // I tried to make `ViewSettings` generic (to allow it to accept any extension of a settings schema), but it didn't work.
            register as unknown as UseFormRegister<
              yup.InferType<typeof viewSettingsSchema>
            >
          }
        />
      </StyledTab.Panel>
      <StyledTab.Panel>
        <ImportSettingsForm initialImports={imports} setImports={setImports} />
      </StyledTab.Panel>
    </StyledTab.Panels>
  );

  const leftPanelRef = useRef<HTMLDivElement | null>(null);

  const withEditor = (
    <div className="flex mt-2">
      <div
        className="w-1/2 relative"
        style={{ minHeight: props.chartHeight }}
        ref={leftPanelRef}
      >
        {tabs}
      </div>
      <div className="w-1/2 p-2 pl-4" data-testid="playground-result">
        {squiggleChart}
      </div>
    </div>
  );

  const withoutEditor = <div className="mt-3">{tabs}</div>;

  const getLeftPanelElement = useCallback(() => {
    return leftPanelRef.current ?? undefined;
  }, []);

  return (
    <SquiggleContainer>
      <PlaygroundContext.Provider value={{ getLeftPanelElement }}>
        <StyledTab.Group>
          <div
            className="pb-4"
            style={{
              minHeight: 200 /* important if editor is hidden */,
            }}
          >
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <StyledTab.List>
                  <StyledTab
                    name={showEditor ? "Code" : "Display"}
                    icon={showEditor ? CodeIcon : EyeIcon}
                  />
                  <StyledTab name="Sampling Settings" icon={CogIcon} />
                  <StyledTab name="View Settings" icon={ChartSquareBarIcon} />
                  <StyledTab name="Input Variables" icon={CurrencyDollarIcon} />
                </StyledTab.List>
              </div>
              <div className="flex gap-2 items-center">
                <RunControls {...runnerState} />
                <TextTooltip text={isMac() ? "Option+Shift+f" : "Alt+Shift+f"}>
                  <div>
                    <Button onClick={editorRef.current?.format}>Format</Button>
                  </div>
                </TextTooltip>
                {showShareButton && <ShareButton />}
              </div>
            </div>
            {showEditor ? withEditor : withoutEditor}
          </div>
        </StyledTab.Group>
      </PlaygroundContext.Provider>
    </SquiggleContainer>
  );
};
