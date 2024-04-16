import { FC, useMemo, useRef } from "react";

import { useUncontrolledCode } from "../lib/hooks/index.js";
import { usePlaygroundSettings } from "../lib/hooks/usePlaygroundSettings.js";
import { useSimulatorManager } from "../lib/hooks/useSimulatorManager.js";
import {
  ProjectExecutionProps,
  simulationErrors,
  StandaloneExecutionProps,
} from "../lib/utility.js";
import { CodeEditor, CodeEditorHandle } from "./CodeEditor/index.js";
import { PartialPlaygroundSettings } from "./PlaygroundSettings.js";
import { ViewerWithMenuBar } from "./ViewerWithMenuBar/index.js";

export type SquiggleEditorProps = {
  defaultCode?: string;
  onCodeChange?(code: string): void;
  editorFontSize?: number;
  // environment comes from StandaloneExecutionProps
} & (StandaloneExecutionProps | ProjectExecutionProps) &
  Omit<PartialPlaygroundSettings, "environment">;

export const SquiggleEditor: FC<SquiggleEditorProps> = ({
  defaultCode: propsDefaultCode,
  onCodeChange,
  project: propsProject,
  environment,
  continues,
  editorFontSize,
  ...defaultSettings
}) => {
  const { settings, randomizeSeed } = usePlaygroundSettings({
    defaultSettings: {
      ...defaultSettings,
      ...{ environment },
    },
  });

  const { code, setCode, defaultCode } = useUncontrolledCode({
    defaultCode: propsDefaultCode,
    onCodeChange,
  });

  const { simulation, project, sourceId, runSimulation } = useSimulatorManager({
    code,
    setup: propsProject
      ? { type: "project", project: propsProject, continues }
      : { type: "standalone" },
    environment: settings.environment,
  });

  const errors = useMemo(() => simulationErrors(simulation), [simulation]);

  const editorRef = useRef<CodeEditorHandle>(null);

  return (
    <div>
      <div
        className="rounded-sm border border-slate-300 bg-slate-50 p-2"
        data-testid="squiggle-editor"
      >
        <CodeEditor
          ref={editorRef}
          defaultValue={defaultCode ?? ""}
          onChange={setCode}
          fontSize={editorFontSize}
          showGutter={false}
          errors={errors}
          project={project}
          sourceId={sourceId}
          onSubmit={runSimulation}
        />
      </div>
      {!simulation ? null : (
        <ViewerWithMenuBar
          simulation={simulation}
          editor={editorRef.current ?? undefined}
          playgroundSettings={settings}
          xPadding={0}
          randomizeSeed={randomizeSeed}
        />
      )}
    </div>
  );
};
