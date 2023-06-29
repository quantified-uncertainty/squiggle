import { zodResolver } from "@hookform/resolvers/zod";
import merge from "lodash/merge.js";
import React, {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { AdjustmentsVerticalIcon, Bars3CenterLeftIcon, Button } from "@quri/ui";

import { useSquiggle, useUncontrolledCode } from "../../lib/hooks/index.js";
import { altKey, getErrors } from "../../lib/utility.js";
import { CodeEditor, CodeEditorHandle } from "../CodeEditor.js";
import { DynamicSquiggleViewer } from "../DynamicSquiggleViewer.js";
import {
  PartialPlaygroundSettings,
  PlaygroundSettingsForm,
  defaultPlaygroundSettings,
  viewSettingsSchema,
  type PlaygroundSettings,
} from "../PlaygroundSettings.js";
import { SquiggleViewerHandle } from "../SquiggleViewer/index.js";
import { MenuItem } from "./MenuItem.js";
import { ResizableTwoPanelLayout } from "./ResizableTwoPanelLayout.js";
import { AutorunnerMenuItem } from "./RunControls/AutorunnerMenuItem.js";
import { RunMenuItem } from "./RunControls/RunMenuItem.js";
import { useRunnerState } from "./RunControls/useRunnerState.js";

type PlaygroundProps = {
  /* We don't support `project` or `continues` in the playground.
   * First, because playground will support multi-file mode by itself.
   * Second, because environment is configurable through playground settings and it won't be possible with an external project.
   */
  defaultCode?: string;
  onCodeChange?(code: string): void;
  /* When settings change */
  onSettingsChange?(settings: PlaygroundSettings): void;
  /* Allows to inject extra buttons, e.g. share button on the website, or save button in Squiggle Hub */
  renderExtraControls?: () => ReactNode;
  /* Height of the playground */
  height?: CSSProperties["height"];
} & PartialPlaygroundSettings;

// Left panel ref is used for local settings modal positioning in ItemSettingsMenu.tsx
type PlaygroundContextShape = {
  getLeftPanelElement: () => HTMLDivElement | undefined;
};
export const PlaygroundContext = React.createContext<PlaygroundContextShape>({
  getLeftPanelElement: () => undefined,
});

type Tab = "CODE" | "SETTINGS";

export const SquigglePlayground: React.FC<PlaygroundProps> = (props) => {
  const { onSettingsChange, renderExtraControls, height = 500 } = props;
  const { code, setCode, defaultCode } = useUncontrolledCode({
    defaultCode: props.defaultCode,
    onCodeChange: props.onCodeChange,
  });

  const defaultValues: PlaygroundSettings = merge(
    {},
    defaultPlaygroundSettings,
    Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined))
  );

  const [selectedTab, setSelectedTab] = useState<Tab>("CODE");

  const form = useForm({
    resolver: zodResolver(viewSettingsSchema),
    defaultValues,
    mode: "onChange",
  });

  const [settings, setSettings] = useState<z.infer<typeof viewSettingsSchema>>(
    () => form.getValues()
  );

  useEffect(() => {
    const submit = form.handleSubmit((data) => {
      setSettings(data);
      onSettingsChange?.(data);
    });
    const subscription = form.watch(() => submit());
    return () => subscription.unsubscribe();
  }, [form, onSettingsChange]);

  const runnerState = useRunnerState(code);

  const [squiggleOutput, { project, isRunning, sourceId }] = useSquiggle({
    code: runnerState.renderedCode,
    executionId: runnerState.executionId,
    environment: settings.environment,
  });

  const errors = useMemo(() => {
    if (!squiggleOutput) {
      return [];
    }
    return getErrors(squiggleOutput.result);
  }, [squiggleOutput]);

  const editorRef = useRef<CodeEditorHandle>(null);
  const viewerRef = useRef<SquiggleViewerHandle>(null);

  const leftPanelBody =
    selectedTab === "CODE" ? (
      <div data-testid="squiggle-editor">
        <CodeEditor
          ref={editorRef}
          defaultValue={defaultCode}
          errors={errors}
          project={project}
          sourceId={sourceId}
          showGutter={true}
          onChange={setCode}
          onViewValuePath={(ast) => viewerRef.current?.viewValuePath(ast)}
          onSubmit={runnerState.run}
        />
      </div>
    ) : selectedTab === "SETTINGS" ? (
      <div className="px-2 space-y-6">
        <div className="px-2 py-2">
          <div className="pb-4">
            <Button onClick={() => setSelectedTab("CODE")}>Back</Button>
          </div>
          <FormProvider {...form}>
            <PlaygroundSettingsForm />
          </FormProvider>
        </div>
      </div>
    ) : null;

  const leftPanelRef = useRef<HTMLDivElement | null>(null);

  const leftPanelHeader = (
    <div className="flex justify-between h-8 bg-slate-50 border-b border-slate-200 overflow-hidden mb-1 px-4">
      <div className="flex">
        <RunMenuItem {...runnerState} isRunning={isRunning} />
        <AutorunnerMenuItem {...runnerState} />
        <MenuItem
          onClick={() =>
            setSelectedTab(selectedTab === "SETTINGS" ? "CODE" : "SETTINGS")
          }
          icon={AdjustmentsVerticalIcon}
          tooltipText="Configuration"
        />
        <MenuItem
          tooltipText={`Format Code (${altKey()}+Shift+f)`}
          icon={Bars3CenterLeftIcon}
          onClick={editorRef.current?.format}
        />
      </div>
      <div className="flex items-center">{renderExtraControls?.()}</div>
    </div>
  );

  const getLeftPanelElement = useCallback(
    () => leftPanelRef.current ?? undefined,
    []
  );

  const renderLeft = () => (
    <div className="h-full flex flex-col" ref={leftPanelRef}>
      {leftPanelHeader}
      <div className="flex-1 grid place-content-stretch overflow-auto">
        {leftPanelBody}
      </div>
    </div>
  );

  const renderRight = () => (
    <DynamicSquiggleViewer
      squiggleOutput={squiggleOutput}
      isRunning={isRunning}
      editor={editorRef.current ?? undefined}
      ref={viewerRef}
      {...settings}
    />
  );

  return (
    <PlaygroundContext.Provider value={{ getLeftPanelElement }}>
      <ResizableTwoPanelLayout
        height={height}
        renderLeft={renderLeft}
        renderRight={renderRight}
      />
    </PlaygroundContext.Provider>
  );
};
