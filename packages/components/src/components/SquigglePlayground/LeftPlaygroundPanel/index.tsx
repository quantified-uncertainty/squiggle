import {
  forwardRef,
  ReactNode,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

import { SqProject } from "@quri/squiggle-lang";
import {
  AdjustmentsVerticalIcon,
  Bars3CenterLeftIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  PuzzleIcon,
  TriangleIcon,
} from "@quri/ui";

import { isSimulating, Simulation } from "../../../lib/hooks/useSimulator.js";
import { altKey, simulationErrors } from "../../../lib/utility.js";
import {
  CodeEditor,
  CodeEditorHandle,
  CodeEditorProps,
} from "../../CodeEditor/index.js";
import { PlaygroundSettings } from "../../PlaygroundSettings.js";
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
  sourceId: string;
  settings: PlaygroundSettings;
  onSettingsChange(settings: PlaygroundSettings): void;
  activeLineNumbers: number[];
  onFocusByEditorLine(line: number): void;
  /* Allows to inject extra buttons to the left panel's menu, e.g. share button on the website, or save button in Squiggle Hub. */
  renderExtraControls?: RenderExtraControls;
  /* Allows to inject extra items to the left panel's dropdown menu. */
  renderExtraDropdownItems?: RenderExtraControls;
  renderExtraModal?: Parameters<typeof PanelWithToolbar>[0]["renderModal"];
  simulation: Simulation | undefined;
  autorunMode: boolean;
  setAutorunMode: (autorunMode: boolean) => void;
  runSimulation: () => void;
  code: string;
  setCode: (code: string) => void;
} & Pick<CodeEditorProps, "onFocusByPath" | "renderImportTooltip">;

// for interactions with this component from outside
export type LeftPlaygroundPanelHandle = {
  getEditor(): CodeEditorHandle | null; // used by "find in editor" feature
  getLeftPanelElement(): HTMLDivElement | null; // used by local settings modal window positioning
};

export const LeftPlaygroundPanel = forwardRef<LeftPlaygroundPanelHandle, Props>(
  function LeftPlaygroundPanel(props, ref) {
    const errors = useMemo(
      () => simulationErrors(props.simulation),
      [props.simulation]
    );

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
        <RunMenuItem
          runSimulation={props.runSimulation}
          autorunMode={props.autorunMode}
          codeHasChanged={props.code !== props.simulation?.code}
          isSimulating={
            props.simulation ? isSimulating(props.simulation) : false
          }
        />
        <AutorunnerMenuItem
          setAutorunMode={props.setAutorunMode}
          autorunMode={props.autorunMode}
        />
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

    const renderBody = () => (
      <div data-testid="squiggle-editor" style={{ display: "contents" }}>
        <CodeEditor
          ref={editorRef}
          // it's important to pass `code` and not `defaultCode` here;
          // see https://github.com/quantified-uncertainty/squiggle/issues/1952
          defaultValue={props.code}
          errors={errors}
          height="100%"
          project={props.project}
          sourceId={props.sourceId}
          gutter={{
            type: "shown",
            activeLineNumbers: props.activeLineNumbers,
            onFocusByEditorLine: props.onFocusByEditorLine,
          }}
          lineWrapping={props.settings.editorSettings.lineWrapping}
          onChange={props.setCode}
          onSubmit={props.runSimulation}
          onFocusByPath={props.onFocusByPath}
          renderImportTooltip={props.renderImportTooltip}
        />
      </div>
    );

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
            body: <DependencyGraphModal project={props.project} />,
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
