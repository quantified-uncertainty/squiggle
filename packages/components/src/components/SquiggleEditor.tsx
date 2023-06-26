import { FC, useMemo } from "react";

import { useSquiggle } from "../lib/hooks/useSquiggle.js";
import { getErrors, getValueToRender } from "../lib/utility.js";
import { CodeEditor } from "./CodeEditor.js";
import { SquiggleViewer, SquiggleViewerProps } from "./SquiggleViewer/index.js";
import { SquiggleCodeProps } from "./types.js";
import { useUncontrolledCode } from "../lib/hooks/index.js";

export type SquiggleEditorProps = SquiggleCodeProps & {
  hideViewer?: boolean;
} & Omit<SquiggleViewerProps, "result">;

export const SquiggleEditor: FC<SquiggleEditorProps> = (props) => {
  const { code, setCode, defaultCode } = useUncontrolledCode(props);

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
          defaultValue={defaultCode}
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
