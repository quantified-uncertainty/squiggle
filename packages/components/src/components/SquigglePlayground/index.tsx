import merge from "lodash/merge.js";
import React, {
  CSSProperties,
  ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";

import { SquiggleOutput } from "../../lib/hooks/useSquiggle.js";
import { DynamicSquiggleViewer } from "../DynamicSquiggleViewer.js";
import {
  PartialPlaygroundSettings,
  defaultPlaygroundSettings,
  type PlaygroundSettings,
} from "../PlaygroundSettings.js";
import { SquiggleViewerHandle } from "../SquiggleViewer/index.js";
import {
  LeftPlaygroundPanel,
  LeftPlaygroundPanelHandle,
  RenderExtraControls,
} from "./LeftPlaygroundPanel/index.js";
import { ResizableTwoPanelLayout } from "./ResizableTwoPanelLayout.js";

type PlaygroundProps = {
  /* We don't support `project` or `continues` in the playground.
   * First, because playground will support multi-file mode by itself.
   * Second, because environment is configurable through playground settings and it won't be possible with an external project.
   */
  defaultCode?: string;
  onCodeChange?(code: string): void;
  /* When settings change */
  onSettingsChange?(settings: PlaygroundSettings): void;
  /* Allows to inject extra buttons to the left panel's menu, e.g. share button on the website, or save button in Squiggle Hub. */
  renderExtraControls?: RenderExtraControls;
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

export const SquigglePlayground: React.FC<PlaygroundProps> = (props) => {
  const {
    defaultCode,
    onCodeChange,
    onSettingsChange,
    renderExtraControls,
    height = 500,
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

  const [output, setOutput] = useState<{
    output: SquiggleOutput | undefined;
    isRunning: boolean;
  }>({ output: undefined, isRunning: false });

  const viewerRef = useRef<SquiggleViewerHandle>(null);

  const leftPanelRef = useRef<LeftPlaygroundPanelHandle>(null);

  const getLeftPanelElement = useCallback(
    () => leftPanelRef.current?.getLeftPanelElement() ?? undefined,
    []
  );

  const renderLeft = () => (
    <LeftPlaygroundPanel
      defaultCode={defaultCode}
      onCodeChange={onCodeChange}
      settings={settings}
      onSettingsChange={handleSettingsChange}
      onOutputChange={setOutput}
      renderExtraControls={renderExtraControls}
      onViewValuePath={(path) => viewerRef.current?.viewValuePath(path)}
      ref={leftPanelRef}
    />
  );

  const renderRight = () => (
    <DynamicSquiggleViewer
      squiggleOutput={output.output}
      isRunning={output.isRunning}
      // FIXME - this will cause viewer to be rendered twice on initial render
      editor={leftPanelRef.current?.getEditor() ?? undefined}
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
