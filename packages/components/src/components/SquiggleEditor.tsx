import React from "react";
import { CodeEditor } from "./CodeEditor";
import { SquiggleContainer } from "./SquiggleContainer";
import { SquiggleChart, SquiggleChartProps } from "./SquiggleChart";
import { useMaybeControlledValue } from "../lib/hooks";

const WrappedCodeEditor: React.FC<{
  code: string;
  setCode: (code: string) => void;
}> = ({ code, setCode }) => (
  <div className="border border-grey-200 p-2 m-4">
    <CodeEditor
      value={code}
      onChange={setCode}
      oneLine={true}
      showGutter={false}
      height={20}
    />
  </div>
);

export type SquiggleEditorProps = SquiggleChartProps & {
  defaultCode?: string;
  onCodeChange?: (code: string) => void;
};

export const SquiggleEditor: React.FC<SquiggleEditorProps> = (props) => {
  const [code, setCode] = useMaybeControlledValue({
    value: props.code,
    defaultValue: props.defaultCode ?? "",
    onChange: props.onCodeChange,
  });

  let chartProps = { ...props, code };
  return (
    <SquiggleContainer>
      <WrappedCodeEditor code={code} setCode={setCode} />
      <SquiggleChart {...chartProps} />
    </SquiggleContainer>
  );
};
