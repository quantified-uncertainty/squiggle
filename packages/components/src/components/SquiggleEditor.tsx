import React, { useState } from "react";
import { CodeEditor } from "./CodeEditor";
import { environment, bindings, jsImports } from "@quri/squiggle-lang";
import { defaultImports, defaultBindings } from "@quri/squiggle-lang";
import { SquiggleContainer } from "./SquiggleContainer";
import { SquiggleChart, SquiggleChartProps } from "./SquiggleChart";
import { useSquigglePartial } from "../lib/hooks";
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
  let defaultCode = props.defaultCode ?? "";
  const [uncontrolledCode, setCode] = useState(defaultCode);
  let code = props.code ?? uncontrolledCode;

  let chartProps = { ...props, code };
  return (
    <SquiggleContainer>
      <WrappedCodeEditor
        code={code}
        setCode={(code) => {
          if (props.onCodeChange) props.onCodeChange(code);

          if (props.code === undefined) setCode(code);
        }}
      />
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
  code,
  defaultCode = "",
  onChange,
  onCodeChange,
  bindings = defaultBindings,
  environment,
  jsImports = defaultImports,
}: SquigglePartialProps) => {
  const [uncontrolledCode, setCode] = useState(defaultCode);
  let codeProp = code ?? uncontrolledCode;

  const result = useSquigglePartial({
    code: codeProp,
    bindings,
    environment,
    jsImports,
    onChange,
  });

  return (
    <SquiggleContainer>
      <WrappedCodeEditor
        code={codeProp}
        setCode={(code) => {
          if (onCodeChange) onCodeChange(code);

          if (code === undefined) setCode(code);
        }}
      />
      {result.tag !== "Ok" ? <SquiggleErrorAlert error={result.value} /> : null}
    </SquiggleContainer>
  );
};
