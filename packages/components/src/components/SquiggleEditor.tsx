import { FC, useMemo, useRef } from "react";

import { useUncontrolledCode } from "../lib/hooks/index.js";
import { useSquiggle } from "../lib/hooks/useSquiggle.js";
import { getErrors } from "../lib/utility.js";
import { CodeEditor, CodeEditorHandle } from "./CodeEditor.js";
import { DynamicSquiggleViewer } from "./DynamicSquiggleViewer.js";
import { PartialPlaygroundSettings } from "./PlaygroundSettings.js";
import { useRunnerState } from "../lib/hooks/useRunnerState.js";
import { SquiggleCodeProps } from "./types.js";

export type SquiggleEditorProps = SquiggleCodeProps & {
  hideViewer?: boolean;
  localSettingsEnabled?: boolean;
  // environment comes from SquiggleCodeProps
} & Omit<PartialPlaygroundSettings, "environment">;

export const SquiggleEditor: FC<SquiggleEditorProps> = ({
  defaultCode: propsDefaultCode,
  onCodeChange,
  project: propsProject,
  continues,
  environment,
  hideViewer,
  localSettingsEnabled,
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
        className="border border-grey-200 p-2 m-4"
        data-testid="squiggle-editor"
      >
        <CodeEditor
          defaultValue={defaultCode ?? ""}
          onChange={setCode}
          showGutter={false}
          errors={errors}
          project={project}
          ref={editorRef}
          onSubmit={() => runnerState.run()}
        />
      </div>
      {hideViewer || !squiggleOutput?.code ? null : (
        <DynamicSquiggleViewer
          squiggleOutput={squiggleOutput}
          isRunning={isRunning}
          localSettingsEnabled={localSettingsEnabled}
          editor={editorRef.current ?? undefined}
          environment={environment}
          {...settings}
        />
      )}
    </div>
  );
};
