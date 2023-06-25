import { FC, useMemo } from "react";

import { useMaybeControlledCode } from "../lib/hooks/index.js";
import { useSquiggle } from "../lib/hooks/useSquiggle.js";
import { getErrors, getValueToRender } from "../lib/utility.js";
import { CodeEditor } from "./CodeEditor.js";
import { SquiggleViewer, SquiggleViewerProps } from "./SquiggleViewer/index.js";
import { SquiggleCodeProps } from "./types.js";

export type SquiggleEditorProps = SquiggleCodeProps & {
  hideViewer?: boolean;
} & Omit<SquiggleViewerProps, "result">;

export const SquiggleEditor: FC<SquiggleEditorProps> = (props) => {
  const [code, setCode] = useMaybeControlledCode(props);

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
