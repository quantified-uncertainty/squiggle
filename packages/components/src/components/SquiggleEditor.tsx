import { FC, useMemo, useRef } from "react";

import { useUncontrolledCode } from "../lib/hooks/index.js";
import { useRunnerState } from "../lib/hooks/useRunnerState.js";
import { useSquiggle } from "../lib/hooks/useSquiggle.js";
import { getErrors } from "../lib/utility.js";
import { CodeEditor, CodeEditorHandle } from "./CodeEditor/index.js";
import { PartialPlaygroundSettings } from "./PlaygroundSettings.js";
import { SquiggleOutputViewer } from "./SquiggleOutputViewer/index.js";
import { SquiggleCodeProps } from "./types.js";

export type SquiggleEditorProps = SquiggleCodeProps & {
  hideViewer?: boolean;
  editorFontSize?: number;
  // environment comes from SquiggleCodeProps
} & Omit<PartialPlaygroundSettings, "environment">;

export const SquiggleEditor: FC<SquiggleEditorProps> = ({
  defaultCode: propsDefaultCode,
  onCodeChange,
  project: propsProject,
  continues,
  environment,
  hideViewer,
  editorFontSize,
  ...settings
}) => {
  const { code, setCode, defaultCode } = useUncontrolledCode({
    defaultCode: propsDefaultCode,
    onCodeChange,
  });

  const runnerState = useRunnerState(code);

  const [squiggleOutput, { project, isRunning }] = useSquiggle({
    code: runnerState.renderedCode,
    executionId: runnerState.executionId,
    ...(propsProject ? { project: propsProject, continues } : { environment }),
  });

  const errors = useMemo(() => {
    if (!squiggleOutput) {
      return [];
    }
    return getErrors(squiggleOutput.output);
  }, [squiggleOutput]);

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
          ref={editorRef}
          onSubmit={() => runnerState.run()}
        />
      </div>
      {hideViewer || !squiggleOutput?.code ? null : (
        <SquiggleOutputViewer
          squiggleOutput={squiggleOutput}
          isRunning={isRunning}
          editor={editorRef.current ?? undefined}
          environment={environment}
          {...settings}
        />
      )}
    </div>
  );
};
