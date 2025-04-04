import { forwardRef, ReactNode, useImperativeHandle, useRef } from "react";

import { SqProject } from "@quri/squiggle-lang";
import {
  AdjustmentsVerticalIcon,
  Bars3CenterLeftIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  TriangleIcon,
} from "@quri/ui";

import { isSimulating, Simulation } from "../../../lib/hooks/useSimulator.js";
import { altKey } from "../../../lib/utility.js";
import {
  CodeEditor,
  CodeEditorHandle,
  CodeEditorProps,
} from "../../CodeEditor/index.js";
import { PlaygroundSettings } from "../../PlaygroundSettings.js";
import { PanelWithToolbar } from "../../ui/PanelWithToolbar/index.js";
import { ToolbarItem } from "../../ui/PanelWithToolbar/ToolbarItem.js";
import { AutorunnerMenuItem } from "./AutorunnerMenuItem.js";
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
        {!props.autorunMode && (
          <RunMenuItem
            runSimulation={props.runSimulation}
            autorunMode={props.autorunMode}
            codeHasChanged={props.code !== props.simulation?.output.module.code}
            isSimulating={
              props.simulation ? isSimulating(props.simulation) : false
            }
          />
        )}

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
      <div data-testid="squiggle-editor" className="min-h-0">
        <CodeEditor
          ref={editorRef}
          // it's important to pass `code` and not `defaultCode` here;
          // see https://github.com/quantified-uncertainty/squiggle/issues/1952
          defaultValue={props.code}
          height="100%"
          project={props.project}
          simulation={props.simulation}
          sourceId={props.sourceId}
          showGutter
          onFocusByPath={props.onFocusByPath}
          lineWrapping={props.settings.editorSettings.lineWrapping}
          onChange={props.setCode}
          onSubmit={props.runSimulation}
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
