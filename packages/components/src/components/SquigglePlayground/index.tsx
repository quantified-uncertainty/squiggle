import React, { CSSProperties, useCallback, useEffect, useRef } from "react";

import { SqLinker } from "@quri/squiggle-lang";
import { RefreshIcon } from "@quri/ui";

import { usePlaygroundSettings } from "../../lib/hooks/usePlaygroundSettings.js";
import { useSimulatorManager } from "../../lib/hooks/useSimulatorManager.js";
import { useUncontrolledCode } from "../../lib/hooks/useUncontrolledCode.js";
import {
  PartialPlaygroundSettings,
  type PlaygroundSettings,
} from "../PlaygroundSettings.js";
import { getActiveLineNumbers } from "../SquiggleViewer/utils.js";
import {
  ViewerWithMenuBar,
  ViewerWithMenuBarHandle,
} from "../ViewerWithMenuBar/index.js";
import {
  LeftPlaygroundPanel,
  LeftPlaygroundPanelHandle,
} from "./LeftPlaygroundPanel/index.js";
import { ResizableTwoPanelLayout } from "./ResizableTwoPanelLayout.js";

export type ModelExport = {
  variableName: string;
  variableType: string;
  title?: string;
  docstring: string;
};

/*
 * We don't support `project` or `continues` in the playground.
 * First, because playground will support multi-file mode by itself.
 * Second, because environment is configurable through playground settings and it should match the project.getEnvironment(), so this component owns the project to guarantee that.
 */
export type SquigglePlaygroundProps = {
  /*
   * Playground code is not reactive, because Codemirror editor is stateful and it would be hard/impossible to support code updates.
   * For example, it's not clear what we could do with the cursor position or selection if this prop is changed.
   * So updates to it are completely ignored.
   */
  defaultCode?: string;
  sourceId?: string;
  linker?: SqLinker;
  onCodeChange?(code: string): void;
  onExportsChange?(exports: ModelExport[]): void;
  /* When settings change */
  onSettingsChange?(settings: PlaygroundSettings): void;
  /* Height of the playground */
  height?: CSSProperties["height"];
} & Pick<
  Parameters<typeof LeftPlaygroundPanel>[0],
  | "renderExtraControls"
  | "renderExtraDropdownItems"
  | "renderExtraModal"
  | "renderImportTooltip"
> &
  PartialPlaygroundSettings;

// Left panel ref is used for local settings modal positioning in ItemSettingsMenu.tsx
type PlaygroundContextShape = {
  getLeftPanelElement: () => HTMLDivElement | undefined;
};
export const PlaygroundContext = React.createContext<PlaygroundContextShape>({
  getLeftPanelElement: () => undefined,
});

export const SquigglePlayground: React.FC<SquigglePlaygroundProps> = (
  props
) => {
  const {
    linker,
    onExportsChange,
    onSettingsChange,
    renderExtraControls,
    renderExtraDropdownItems,
    renderExtraModal,
    renderImportTooltip,
    height = 500,
    ...defaultSettings
  } = props;

  // `settings` are owned by SquigglePlayground.
  // This can cause some unnecessary renders (e.g. settings form), but most heavy playground subcomponents
  // should rerender on settings changes (e.g. right panel), so that's fine.
  const { settings, setSettings, randomizeSeed } = usePlaygroundSettings({
    defaultSettings,
    onSettingsChange,
  });

  const { code, setCode } = useUncontrolledCode({
    defaultCode: props.defaultCode,
    onCodeChange: props.onCodeChange,
  });

  const {
    project,
    simulation,
    sourceId,
    autorunMode,
    setAutorunMode,
    runSimulation,
  } = useSimulatorManager({
    code,
    setup: { type: "projectFromLinker", linker },
    environment: settings.environment,
  });

  useEffect(() => {
    const _output = simulation?.output;
    if (_output && _output.ok) {
      const exports = _output.value.exports;
      const _exports: ModelExport[] = exports.entries().map((e) => ({
        variableName: e[0],
        variableType: e[1].tag,
        title: e[1].title(),
        docstring: e[1].context?.docstring() || "",
      }));
      onExportsChange && onExportsChange(_exports);
    } else {
      onExportsChange && onExportsChange([]);
    }
  }, [simulation, onExportsChange]);

  const leftPanelRef = useRef<LeftPlaygroundPanelHandle>(null);
  const rightPanelRef = useRef<ViewerWithMenuBarHandle>(null);

  const getLeftPanelElement = useCallback(
    () => leftPanelRef.current?.getLeftPanelElement() ?? undefined,
    []
  );

  const renderLeft = () => {
    const lineNumbers = getActiveLineNumbers(simulation?.output);
    return (
      <LeftPlaygroundPanel
        simulation={simulation}
        project={project}
        code={code}
        setCode={setCode}
        sourceId={sourceId}
        settings={settings}
        onSettingsChange={setSettings}
        renderExtraControls={renderExtraControls}
        renderExtraDropdownItems={renderExtraDropdownItems}
        renderExtraModal={renderExtraModal}
        renderImportTooltip={renderImportTooltip}
        ref={leftPanelRef}
        activeLineNumbers={lineNumbers}
        onFocusByPath={(path) => {
          rightPanelRef.current?.squiggleViewerHandle?.focusByPath(path);
        }}
        onFocusByEditorLine={(line) =>
          rightPanelRef.current?.focusByEditorLine(line)
        }
        autorunMode={autorunMode}
        setAutorunMode={setAutorunMode}
        runSimulation={runSimulation}
      />
    );
  };

  const renderRight = () =>
    simulation ? (
      <ViewerWithMenuBar
        simulation={simulation}
        // FIXME - this will cause viewer to be rendered twice on initial render
        editor={leftPanelRef.current?.getEditor() ?? undefined}
        playgroundSettings={settings}
        ref={rightPanelRef}
        xPadding={2}
        randomizeSeed={() => {
          randomizeSeed();
          if (!autorunMode) {
            runSimulation();
          }
        }}
      />
    ) : (
      <div className="grid place-items-center h-full">
        <RefreshIcon className="animate-spin text-slate-400" size={24} />
      </div>
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
