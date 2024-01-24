import merge from "lodash/merge.js";
import React, {
  CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { SqLinker, SqProject } from "@quri/squiggle-lang";
import { RefreshIcon } from "@quri/ui";

import { useRunnerState } from "../../lib/hooks/useRunnerState.js";
import { SquiggleOutput } from "../../lib/hooks/useSquiggle.js";
import { useUncontrolledCode } from "../../lib/hooks/useUncontrolledCode.js";
import {
  defaultPlaygroundSettings,
  PartialPlaygroundSettings,
  type PlaygroundSettings,
} from "../PlaygroundSettings.js";
import { SquiggleOutputViewer } from "../SquiggleOutputViewer/index.js";
import { SquiggleViewerHandle } from "../SquiggleViewer/ViewerProvider.js";
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
    defaultCode,
    linker,
    onCodeChange,
    onExportsChange,
    onSettingsChange,
    renderExtraControls,
    renderExtraDropdownItems,
    renderExtraModal,
    renderImportTooltip,
    height = 500,
    sourceId,
    ...defaultSettings
  } = props;

  // `settings` are owned by SquigglePlayground.
  // This can cause some unnecessary renders (e.g. settings form), but most heavy playground subcomponents
  // should rerender on settings changes (e.g. right panel), so that's fine.
  const [settings, setSettings] = useState(
    () =>
      merge(
        {},
        defaultPlaygroundSettings,
        Object.fromEntries(
          Object.entries(defaultSettings).filter(([, v]) => v !== undefined)
        )
      ) as PlaygroundSettings
  );
  const handleSettingsChange = useCallback(
    (newSettings: PlaygroundSettings) => {
      setSettings(newSettings);
      onSettingsChange?.(newSettings);
    },
    [onSettingsChange]
  );

  const [project] = useState(() => {
    // not reactive on `linker` changes; TODO?
    return new SqProject({ linker });
  });

  const [seed, setSeed] = useState<string>("0");

  useEffect(() => {
    project.setEnvironment({ ...settings.environment, seed });
    leftPanelRef.current?.invalidate();
  }, [project, settings.environment, seed]);

  const [output, setOutput] = useState<{
    output: SquiggleOutput | undefined;
    isRunning: boolean;
  }>({ output: undefined, isRunning: false });

  useEffect(() => {
    const _output = output.output?.output;
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
  }, [output, onExportsChange]);

  const { code, setCode } = useUncontrolledCode({
    defaultCode: props.defaultCode,
    onCodeChange: props.onCodeChange,
  });

  const runnerState = useRunnerState(code, seed);

  const leftPanelRef = useRef<LeftPlaygroundPanelHandle>(null);
  const rightPanelRef = useRef<SquiggleViewerHandle>(null);

  const getLeftPanelElement = useCallback(
    () => leftPanelRef.current?.getLeftPanelElement() ?? undefined,
    []
  );

  const renderLeft = () => (
    <LeftPlaygroundPanel
      project={project}
      seed={seed}
      defaultCode={defaultCode}
      sourceId={sourceId}
      onCodeChange={onCodeChange}
      settings={settings}
      onSettingsChange={handleSettingsChange}
      onOutputChange={setOutput}
      renderExtraControls={renderExtraControls}
      renderExtraDropdownItems={renderExtraDropdownItems}
      renderExtraModal={renderExtraModal}
      onViewValuePath={(path) => rightPanelRef.current?.viewValuePath(path)}
      renderImportTooltip={renderImportTooltip}
      ref={leftPanelRef}
      runnerState={runnerState}
      code={code}
      setCode={setCode}
    />
  );

  const renderRight = () =>
    output.output ? (
      <SquiggleOutputViewer
        squiggleOutput={output.output}
        isRunning={output.isRunning}
        // FIXME - this will cause viewer to be rendered twice on initial render
        editor={leftPanelRef.current?.getEditor() ?? undefined}
        ref={rightPanelRef}
        seed={seed}
        setSeed={setSeed}
        {...settings}
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
