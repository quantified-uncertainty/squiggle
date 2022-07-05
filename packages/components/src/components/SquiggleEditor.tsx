import React from "react";
import { CodeEditor } from "./CodeEditor";
import { environment, bindings, jsImports } from "@quri/squiggle-lang";
import { defaultImports, defaultBindings } from "@quri/squiggle-lang";
import { SquiggleContainer } from "./SquiggleContainer";
import { SquiggleChart, SquiggleChartProps } from "./SquiggleChart";
import { useSquigglePartial, useMaybeControlledValue } from "../lib/hooks";
import { SquiggleErrorAlert } from "./SquiggleErrorAlert";

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
    defaultValue: props.defaultCode,
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

export interface SquigglePartialProps {
  /** The text inside the input (controlled) */
  code?: string;
  /** The default text inside the input (unControlled) */
  defaultCode?: string;
  /** when the environment changes. Used again for notebook magic*/
  onChange?(expr: bindings | undefined): void;
  /** When the code changes */
  onCodeChange?(code: string): void;
  /** Previously declared variables */
  bindings?: bindings;
  /** If the output requires monte carlo sampling, the amount of samples */
  environment?: environment;
  /** Variables imported from js */
  jsImports?: jsImports;
}

export const SquigglePartial: React.FC<SquigglePartialProps> = ({
  code: controlledCode,
  defaultCode = "",
  onChange,
  onCodeChange,
  bindings = defaultBindings,
  environment,
  jsImports = defaultImports,
}: SquigglePartialProps) => {
  const [code, setCode] = useMaybeControlledValue<string>({
    value: controlledCode,
    defaultValue: defaultCode,
    onChange: onCodeChange,
  });

  const result = useSquigglePartial({
    code,
    bindings,
    environment,
    jsImports,
    onChange,
  });

  return (
    <SquiggleContainer>
      <WrappedCodeEditor code={code} setCode={setCode} />
      {result.tag !== "Ok" ? <SquiggleErrorAlert error={result.value} /> : null}
    </SquiggleContainer>
  );
};
