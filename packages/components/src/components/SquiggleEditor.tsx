import React from "react";
import { CodeEditor } from "./CodeEditor";
import { SquiggleContainer } from "./SquiggleContainer";
import { useMaybeControlledValue } from "../lib/hooks";
import { useSquiggle, SquiggleArgs } from "../lib/hooks/useSquiggle";
import { SqLocation } from "@quri/squiggle-lang";
import { SquiggleViewer, SquiggleViewerProps } from "./SquiggleViewer";
import { getErrorLocations, getValueToRender } from "../lib/utility";

const WrappedCodeEditor: React.FC<{
  code: string;
  setCode: (code: string) => void;
  errorLocations?: SqLocation[];
}> = ({ code, setCode, errorLocations }) => (
  <div className="border border-grey-200 p-2 m-4" data-testid="squiggle-editor">
    <CodeEditor
      value={code}
      onChange={setCode}
      oneLine={true}
      showGutter={false}
      height={20}
      errorLocations={errorLocations}
    />
  </div>
);

export type SquiggleEditorProps = SquiggleArgs & {
  defaultCode?: string;
  onCodeChange?: (code: string) => void;
} & Omit<SquiggleViewerProps, "result">;

export const SquiggleEditor: React.FC<SquiggleEditorProps> = (props) => {
  const [code, setCode] = useMaybeControlledValue({
    value: props.code,
    defaultValue: props.defaultCode ?? "",
    onChange: props.onCodeChange,
  });

  const resultAndBindings = useSquiggle({ ...props, code });

  const valueToRender = getValueToRender(resultAndBindings);
  const errorLocations = getErrorLocations(resultAndBindings.result);

  return (
    <SquiggleContainer>
      <WrappedCodeEditor
        code={code}
        setCode={setCode}
        errorLocations={errorLocations}
      />
      <SquiggleViewer result={valueToRender} {...props} />
    </SquiggleContainer>
  );
};
