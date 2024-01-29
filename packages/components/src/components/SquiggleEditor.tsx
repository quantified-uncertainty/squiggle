import { FC, useMemo, useRef } from "react";

import { useUncontrolledCode } from "../lib/hooks/index.js";
import { useSquiggleRunner } from "../lib/hooks/useSquiggleRunner.js";
import {
  getSquiggleOutputErrors,
  ProjectExecutionProps,
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

  const { squiggleProjectRun, project, sourceId, rerunSquiggleCode } =
    useSquiggleRunner({
      code,
      setup: propsProject
        ? { type: "project", project: propsProject, continues }
        : { type: "standalone" },
      environment,
    });

  const errors = useMemo(
    () => getSquiggleOutputErrors(squiggleProjectRun),
    [squiggleProjectRun]
  );

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
          onSubmit={rerunSquiggleCode}
        />
      </div>

      {!squiggleProjectRun ? null : (
        <ViewerWithMenuBar
          squiggleProjectRun={squiggleProjectRun}
          editor={editorRef.current ?? undefined}
          playgroundSettings={settings}
        />
      )}
    </div>
  );
};
