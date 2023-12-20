import {
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

import { SqProject, SqValuePath } from "@quri/squiggle-lang";
import {
  AdjustmentsVerticalIcon,
  Bars3CenterLeftIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  PuzzleIcon,
  TriangleIcon,
} from "@quri/ui";

import {
  SquiggleOutput,
  useRunnerState,
  useSquiggle,
  useUncontrolledCode,
} from "../../../lib/hooks/index.js";
import {
  altKey,
  getErrors,
  getResultVariables,
  SqValueWithContext,
  valueHasContext,
} from "../../../lib/utility.js";
import { CodeEditor, CodeEditorHandle } from "../../CodeEditor/index.js";
import { PlaygroundSettings } from "../../PlaygroundSettings.js";
import { ValueViewer } from "../../SquiggleViewer/ValueViewer.js";
import { PanelWithToolbar } from "../../ui/PanelWithToolbar/index.js";
import { ToolbarItem } from "../../ui/PanelWithToolbar/ToolbarItem.js";
import { AutorunnerMenuItem } from "./AutorunnerMenuItem.js";
import { DependencyGraphModal } from "./DependencyGraphModal.js";
import { GlobalSettingsModal } from "./GlobalSettingsModal.js";
import { RunMenuItem } from "./RunMenuItem.js";

export type RenderExtraControls = (props: {
  openModal: (name: string) => void;
}) => ReactNode;

type Props = {
  project: SqProject;
  squiggleOutput: SquiggleOutput | undefined;
  defaultCode?: string;
  sourceId?: string;
  onCodeChange?(code: string): void;
  settings: PlaygroundSettings;
  onSettingsChange(settings: PlaygroundSettings): void;
  onOutputChange(output: {
    output: SquiggleOutput | undefined;
    isRunning: boolean;
  }): void;
  /* Allows to inject extra buttons to the left panel's menu, e.g. share button on the website, or save button in Squiggle Hub. */
  renderExtraControls?: RenderExtraControls;
  /* Allows to inject extra items to the left panel's dropdown menu. */
  renderExtraDropdownItems?: RenderExtraControls;
  renderExtraModal?: Parameters<typeof PanelWithToolbar>[0]["renderModal"];
  onViewValuePath?: (path: SqValuePath) => void;
};

// for interactions with this component from outside
export type LeftPlaygroundPanelHandle = {
  getEditor(): CodeEditorHandle | null; // used by "find in editor" feature
  getLeftPanelElement(): HTMLDivElement | null; // used by local settings modal window positioning
  run(): void; // force re-run
  invalidate(): void; // mark output as stale but don't re-run if autorun is disabled; useful on environment changes, triggered in <SquigglePlayground> code
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
      project: props.project,
      sourceId: props.sourceId,
      executionId: runnerState.executionId,
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
      run: () => runnerState.run(),
      invalidate: () => {
        if (runnerState.autorunMode) {
          runnerState.run();
        }
      },
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
        <Dropdown
          render={() => (
            <DropdownMenu>
              <DropdownMenuActionItem
                title="Configuration"
                icon={AdjustmentsVerticalIcon}
                onClick={() => openModal("settings")}
              />
              <DropdownMenuActionItem
                title="Dependency Graph"
                icon={PuzzleIcon}
                onClick={() => openModal("dependency-graph")}
              />
              {props.renderExtraDropdownItems?.({ openModal })}
            </DropdownMenu>
          )}
        >
          <ToolbarItem icon={TriangleIcon} iconClasses="rotate-180">
            Menu
          </ToolbarItem>
        </Dropdown>
        <div className="flex-1">
          {props.renderExtraControls?.({ openModal })}
        </div>
      </div>
    );

    const renderBody = () => {
      const bar = squiggleOutput && getResultVariables(squiggleOutput);
      let items: { variableName: string; value: SqValueWithContext }[] = [];
      if (bar && bar.ok) {
        const _items = bar?.value.value.entries().map((e) => {
          const variableName = e[0];
          const value = e[1];
          if (!valueHasContext(value)) {
            throw new Error("Value has no context");
          } else {
            console.log(value.context.findLocation());
            return { variableName, value };
          }
        });
        items = _items;
      }
      return (
        <div className="flex flex-row">
          <div
            className="w-7/12 border-r border-slate-200"
            data-testid="squiggle-editor"
          >
            <CodeEditor
              ref={editorRef}
              // it's important to pass `code` and not `defaultCode` here;
              // see https://github.com/quantified-uncertainty/squiggle/issues/1952
              defaultValue={code}
              errors={errors}
              height="100%"
              project={project}
              sourceId={sourceId}
              showGutter={true}
              lineWrapping={props.settings.editorSettings.lineWrapping}
              onChange={setCode}
              onViewValuePath={props.onViewValuePath}
              onSubmit={runnerState.run}
            />
          </div>
          <div className="w-5/12 px-2">
            <div className="relative">
              {items.map(({ variableName, value }) => (
                <div
                  key={variableName}
                  className={
                    "border border-slate-100 rounded-sm bg-white absolute w-full"
                  }
                  style={{
                    top: value.context.findLocation().start.line * 20 - 35,
                  }}
                >
                  <ValueViewer value={value} />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };

    const renderModal = (modalName: string) => {
      switch (modalName) {
        case "settings":
          return {
            title: "Configuration",
            body: (
              <GlobalSettingsModal
                settings={props.settings}
                onSettingsChange={props.onSettingsChange}
              />
            ),
          };
        case "dependency-graph":
          return {
            title: "Dependency Graph",
            body: <DependencyGraphModal project={project} />,
          };
        default:
          return props.renderExtraModal?.(modalName);
      }
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
