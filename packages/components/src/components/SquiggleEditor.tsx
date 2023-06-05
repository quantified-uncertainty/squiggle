import React from "react";

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

  const resultAndBindings = useSquiggle({ ...props, code });
  const valueToRender = getValueToRender(resultAndBindings);
  const errors = getErrors(resultAndBindings.result);

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
          project={resultAndBindings.project}
        />
      </div>
      {props.hideViewer ? null : (
        <SquiggleViewer result={valueToRender} {...props} />
      )}
    </div>
  );
};
