import { FC, useMemo, useRef } from "react";

import { useUncontrolledCode } from "../lib/hooks/index.js";
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
  // environment comes from SquiggleCodeProps
} & (StandaloneExecutionProps | ProjectExecutionProps) &
  Omit<PartialPlaygroundSettings, "environment">;

export const SquiggleEditor: FC<SquiggleEditorProps> = ({
  defaultCode: propsDefaultCode,
  onCodeChange,
  project: propsProject,
  continues,
  environment,
  editorFontSize,
  ...settings
}) => {
  const { code, setCode, defaultCode } = useUncontrolledCode({
    defaultCode: propsDefaultCode,
    onCodeChange,
  });

  const { simulation, project, sourceId, runSimulation } = useSimulatorManager({
    code,
    setup: propsProject
      ? { type: "project", project: propsProject, continues }
      : { type: "standalone" },
    environment,
  });

  const errors = useMemo(() => simulationErrors(simulation), [simulation]);

  const editorRef = useRef<CodeEditorHandle>(null);

  return (
    <div>
      <div
        className="border border-slate-300 bg-slate-50 rounded-sm p-2"
        data-testid="squiggle-editor"
      >
        <CodeEditor
          defaultValue={defaultCode ?? ""}
          onChange={setCode}
          fontSize={editorFontSize}
          showGutter={false}
          errors={errors}
          project={project}
          sourceId={sourceId}
          ref={editorRef}
          activeLineNumbers={[]}
          onFocusFromEditorLine={() => {}}
          onSubmit={runSimulation}
        />
      </div>

      {!simulation ? null : (
        <ViewerWithMenuBar
          simulation={simulation}
          editor={editorRef.current ?? undefined}
          playgroundSettings={settings}
        />
      )}
    </div>
  );
};
