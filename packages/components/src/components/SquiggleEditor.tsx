import { FC, useMemo, useRef } from "react";

import { useUncontrolledCode } from "../lib/hooks/index.js";
import { useSquiggle } from "../lib/hooks/useSquiggle.js";
import { getErrors } from "../lib/utility.js";
import { CodeEditor, CodeEditorHandle } from "./CodeEditor.js";
import { DynamicSquiggleViewer } from "./DynamicSquiggleViewer.js";
import { PartialPlaygroundSettings } from "./PlaygroundSettings.js";
import { SquiggleCodeProps } from "./types.js";
import { useRunnerState } from "./SquigglePlayground/RunControls/useRunnerState.js";

export type SquiggleEditorProps = SquiggleCodeProps & {
  hideViewer?: boolean;
  localSettingsEnabled?: boolean;
} & PartialPlaygroundSettings;

export const SquiggleEditor: FC<SquiggleEditorProps> = ({
  defaultCode: propsDefaultCode,
  onCodeChange,
  project: propsProject,
  continues,
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
    project: propsProject,
    continues,
  });

  const errors = useMemo(() => {
    if (!squiggleOutput) {
      return [];
    }
    return getErrors(squiggleOutput.result);
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
        />
      </div>
      {hideViewer || !squiggleOutput?.code ? null : (
        <DynamicSquiggleViewer
          squiggleOutput={squiggleOutput}
          localSettingsEnabled={localSettingsEnabled}
          isRunning={isRunning}
          {...settings}
        />
      )}
    </div>
  );
};
