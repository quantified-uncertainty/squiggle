import {
  ReactNode,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

import { SqValuePath } from "@quri/squiggle-lang";
import { Bars3CenterLeftIcon } from "@quri/ui";

import {
  SquiggleOutput,
  useRunnerState,
  useSquiggle,
  useUncontrolledCode,
} from "../../../lib/hooks/index.js";
import { altKey, getErrors } from "../../../lib/utility.js";
import { CodeEditor, CodeEditorHandle } from "../../CodeEditor.js";
import { PlaygroundSettings } from "../../PlaygroundSettings.js";
import { ToolbarItem } from "../../ui/PanelWithToolbar/ToolbarItem.js";
import { PanelWithToolbar } from "../../ui/PanelWithToolbar/index.js";
import { AutorunnerMenuItem } from "./AutorunnerMenuItem.js";
import { GlobalSettingsModal } from "./GlobalSettingsModal.js";
import { RunMenuItem } from "./RunMenuItem.js";
import { SetttingsMenuItem } from "./SettingsMenuItem.js";

export type RenderExtraControls = (props: {
  openModal: (name: string) => void;
}) => ReactNode;

type Props = {
  defaultCode?: string;
  onCodeChange?(code: string): void;
  settings: PlaygroundSettings;
  onSettingsChange(settings: PlaygroundSettings): void;
  onOutputChange(output: {
    output: SquiggleOutput | undefined;
    isRunning: boolean;
  }): void;
  /* Allows to inject extra buttons to the left panel's menu, e.g. share button on the website, or save button in Squiggle Hub. */
  renderExtraControls?: RenderExtraControls;
  renderExtraModal?: Parameters<typeof PanelWithToolbar>[0]["renderModal"];
  onViewValuePath?: (path: SqValuePath) => void;
};

// for interactions with this component from outside
export type LeftPlaygroundPanelHandle = {
  getEditor(): CodeEditorHandle | null; // used by "find in editor" feature
  getLeftPanelElement(): HTMLDivElement | null; // used by local settings modal window positioning
};

export const LeftPlaygroundPanel = forwardRef<LeftPlaygroundPanelHandle, Props>(
  function LeftPlaygroundPanel(props, ref) {
    const { code, setCode } = useUncontrolledCode({
      defaultCode: props.defaultCode,
      onCodeChange: props.onCodeChange,
    });

    const runnerState = useRunnerState(code);

    const [squiggleOutput, { project, isRunning, sourceId }] = useSquiggle({
      code: runnerState.renderedCode,
      executionId: runnerState.executionId,
      environment: props.settings.environment,
    });

    const { onOutputChange } = props;
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
      return getErrors(squiggleOutput.output);
    }, [squiggleOutput]);

    const editorRef = useRef<CodeEditorHandle>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getEditor: () => editorRef.current,
      getLeftPanelElement: () => containerRef.current,
    }));

    const renderToolbar = ({
      openModal,
    }: {
      openModal: (name: string) => void;
    }) => (
      <div className="flex">
        <RunMenuItem {...runnerState} isRunning={isRunning} />
        <AutorunnerMenuItem {...runnerState} />
        <ToolbarItem
          tooltipText={`Format Code (${altKey()}+Shift+f)`}
          icon={Bars3CenterLeftIcon}
          onClick={editorRef.current?.format}
        />
        <SetttingsMenuItem onClick={() => openModal("settings")} />
        <div className="flex-1">
          {props.renderExtraControls?.({ openModal })}
        </div>
      </div>
    );

    const renderBody = () => (
      <div data-testid="squiggle-editor" style={{ display: "contents" }}>
        <CodeEditor
          ref={editorRef}
          // it's important to pass `code` and not `defaultCode` here;
          // see https://github.com/quantified-uncertainty/squiggle/issues/1952
          defaultValue={code}
          errors={errors}
          height={"100%"}
          project={project}
          sourceId={sourceId}
          showGutter={true}
          lineWrapping={props.settings.editorSettings.lineWrapping}
          onChange={setCode}
          onViewValuePath={props.onViewValuePath}
          onSubmit={runnerState.run}
        />
      </div>
    );

    const renderModal = (modalName: string) => {
      if (modalName === "settings") {
        return {
          title: "Configuration",
          body: (
            <GlobalSettingsModal
              settings={props.settings}
              onSettingsChange={props.onSettingsChange}
            />
          ),
        };
      }
      return props.renderExtraModal?.(modalName);
    };

    return (
      <div ref={containerRef} className="h-full">
        <PanelWithToolbar
          renderBody={renderBody}
          renderToolbar={renderToolbar}
          renderModal={renderModal}
        />
      </div>
    );
  }
);
