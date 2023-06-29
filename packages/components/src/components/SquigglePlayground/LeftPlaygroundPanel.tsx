import { zodResolver } from "@hookform/resolvers/zod";
import {
  FC,
  ReactNode,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormProvider, useForm } from "react-hook-form";

import { AdjustmentsVerticalIcon, Bars3CenterLeftIcon, Button } from "@quri/ui";

import { useSquiggle, useUncontrolledCode } from "../../lib/hooks/index.js";
import { altKey, getErrors } from "../../lib/utility.js";
import { CodeEditor, CodeEditorHandle } from "../CodeEditor.js";
import {
  PlaygroundSettings,
  PlaygroundSettingsForm,
  viewSettingsSchema,
} from "../PlaygroundSettings.js";
import { MenuItem } from "./MenuItem.js";
import { AutorunnerMenuItem } from "./RunControls/AutorunnerMenuItem.js";
import { RunMenuItem } from "./RunControls/RunMenuItem.js";
import { useRunnerState } from "./RunControls/useRunnerState.js";
import { SqValuePath } from "@quri/squiggle-lang";
import { SquiggleOutput } from "../../lib/hooks/useSquiggle.js";

type Props = {
  defaultCode?: string;
  onCodeChange?(code: string): void;
  defaultSettings: PlaygroundSettings;
  onSettingsChange(settings: PlaygroundSettings): void;
  onOutputChange(output: {
    output: SquiggleOutput | undefined;
    isRunning: boolean;
  }): void;
  renderExtraControls?: () => ReactNode;
  onViewValuePath?: (path: SqValuePath) => void;
};

export type LeftPlaygroundPanelHandle = {
  getEditor(): CodeEditorHandle | null;
  getLeftPanelElement(): HTMLDivElement | null;
};

type Tab = "CODE" | "SETTINGS";

export const LeftPlaygroundPanel = forwardRef<LeftPlaygroundPanelHandle, Props>(
  function LeftPanel(props, ref) {
    const { code, setCode, defaultCode } = useUncontrolledCode({
      defaultCode: props.defaultCode,
      onCodeChange: props.onCodeChange,
    });

    const form = useForm({
      resolver: zodResolver(viewSettingsSchema),
      defaultValues: props.defaultSettings,
      mode: "onChange",
    });

    const [environment, setEnvironment] = useState(
      props.defaultSettings.environment
    );

    const { onSettingsChange, onOutputChange } = props;

    useEffect(() => {
      const submit = form.handleSubmit((settings) => {
        onSettingsChange(settings);
        // Force new object, so that useSquiggle would rerun.
        // TODO - maybe this is excessive; also it should only happen when autorun is enabled
        setEnvironment({ ...settings.environment });
      });
      const subscription = form.watch(() => submit());
      return () => subscription.unsubscribe();
    }, [form, onSettingsChange]);

    const runnerState = useRunnerState(code);

    const [squiggleOutput, { project, isRunning, sourceId }] = useSquiggle({
      code: runnerState.renderedCode,
      executionId: runnerState.executionId,
      environment,
    });

    useEffect(() => {
      onOutputChange({
        output: squiggleOutput,
        isRunning,
      });
    }, [onOutputChange, squiggleOutput, isRunning]);

    const errors = useMemo(() => {
      if (!squiggleOutput) {
        return [];
      }
      return getErrors(squiggleOutput.result);
    }, [squiggleOutput]);

    const [selectedTab, setSelectedTab] = useState<Tab>("CODE");

    const editorRef = useRef<CodeEditorHandle>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getEditor: () => editorRef.current,
      getLeftPanelElement: () => containerRef.current,
    }));

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
            onViewValuePath={props.onViewValuePath}
            onSubmit={runnerState.run}
          />
        </div>
      ) : selectedTab === "SETTINGS" ? (
        <div className="px-4 py-2">
          <div className="pb-4">
            <Button onClick={() => setSelectedTab("CODE")}>Back</Button>
          </div>
          <FormProvider {...form}>
            <PlaygroundSettingsForm />
          </FormProvider>
        </div>
      ) : null;

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
        <div className="flex items-center">{props.renderExtraControls?.()}</div>
      </div>
    );

    return (
      <div className="h-full flex flex-col" ref={containerRef}>
        {leftPanelHeader}
        <div className="flex-1 grid place-content-stretch overflow-auto">
          {leftPanelBody}
        </div>
      </div>
    );
  }
);
