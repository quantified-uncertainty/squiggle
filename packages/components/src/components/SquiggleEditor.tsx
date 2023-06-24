import React, { useMemo } from "react";

import { useMaybeControlledValue } from "../lib/hooks/index.js";
import { SquiggleArgs, useSquiggle } from "../lib/hooks/useSquiggle.js";
import { getErrors, getValueToRender } from "../lib/utility.js";
import { CodeEditor } from "./CodeEditor.js";
import { SquiggleViewer, SquiggleViewerProps } from "./SquiggleViewer/index.js";

export type SquiggleEditorProps = SquiggleArgs & {
  defaultCode?: string;
  onCodeChange?: (code: string) => void;
  hideViewer?: boolean;
} & Omit<SquiggleViewerProps, "result">;

export const SquiggleEditor: React.FC<SquiggleEditorProps> = (props) => {
  const [code, setCode] = useMaybeControlledValue({
    value: props.code,
    defaultValue: props.defaultCode ?? "",
    onChange: props.onCodeChange,
  });

  const [squiggleOutput, { project }] = useSquiggle({ ...props, code });

  const errors = useMemo(() => {
    if (!squiggleOutput) {
      return [];
    }
    return getErrors(squiggleOutput.result);
  }, [squiggleOutput]);

  return (
    <div>
      <div
        className="border border-grey-200 p-2 m-4"
        data-testid="squiggle-editor"
      >
        <CodeEditor
          value={code}
          onChange={setCode}
          showGutter={false}
          errors={errors}
          project={project}
        />
      </div>
      {props.hideViewer || !squiggleOutput ? null : (
        <div data-testid="editor-result">
          <SquiggleViewer
            result={getValueToRender(squiggleOutput)}
            {...props}
          />
        </div>
      )}
    </div>
  );
};
