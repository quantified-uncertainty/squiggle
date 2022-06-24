import React, { useState } from "react";
import * as ReactDOM from "react-dom";
import { CodeEditor } from "./CodeEditor";
import {
  squiggleExpression,
  environment,
  bindings,
  jsImports,
  defaultEnvironment,
} from "@quri/squiggle-lang";
import { defaultImports, defaultBindings } from "@quri/squiggle-lang";
import { SquiggleContainer } from "./SquiggleContainer";
import { useSquiggle, useSquigglePartial } from "../lib/hooks";
import { SquiggleErrorAlert } from "./SquiggleErrorAlert";
import { SquiggleItem } from "./SquiggleItem";

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

export interface SquiggleEditorProps {
  /** The input string for squiggle */
  initialSquiggleString?: string;
  /** The width of the element */
  width?: number;
  /** If the result is a function, where the function starts */
  diagramStart?: number;
  /** If the result is a function, where the function ends */
  diagramStop?: number;
  /** If the result is a function, how many points along the function it samples */
  diagramCount?: number;
  /** When the environment changes. Used again for notebook magic */
  onChange?(expr: squiggleExpression | undefined): void;
  /** Previous variable declarations */
  bindings?: bindings;
  /** If the output requires monte carlo sampling, the amount of samples */
  environment?: environment;
  /** JS Imports */
  jsImports?: jsImports;
  /** Whether to show detail about types of the returns, default false */
  showTypes?: boolean;
  /** Whether to give users access to graph controls */
  showControls?: boolean;
  /** Whether to show a summary table */
  showSummary?: boolean;
  /** Whether to log the x coordinate on distribution charts */
  logX?: boolean;
  /** Whether to exp the y coordinate on distribution charts */
  expY?: boolean;
  /** Display 94% interval; useful for thin lognormals */
  truncateTo95ci?: boolean;
}

export const SquiggleEditor: React.FC<SquiggleEditorProps> = ({
  initialSquiggleString = "",
  width,
  diagramStart = 0,
  diagramStop = 10,
  diagramCount = 20,
  onChange,
  bindings = defaultBindings,
  environment,
  jsImports = defaultImports,
  showTypes = false,
  showControls = false,
  showSummary = false,
  logX = false,
  expY = false,
  truncateTo95ci = false,
}: SquiggleEditorProps) => {
  const [code, setCode] = useState(initialSquiggleString);
  React.useEffect(
    () => setCode(initialSquiggleString),
    [initialSquiggleString]
  );

  const { result, observableRef } = useSquiggle({
    code,
    bindings,
    environment,
    jsImports,
    onChange,
  });

  const chartSettings = {
    start: diagramStart,
    stop: diagramStop,
    count: diagramCount,
  };

  const distributionPlotSettings = {
    showControls,
    showSummary,
    logX,
    expY,
    truncateTo95ci,
  };

  return (
    <div ref={observableRef}>
      <SquiggleContainer>
        <WrappedCodeEditor code={code} setCode={setCode} />
        {result.tag === "Ok" ? (
          <SquiggleItem
            expression={result.value}
            width={width}
            height={200}
            distributionPlotSettings={distributionPlotSettings}
            showTypes={showTypes}
            chartSettings={chartSettings}
            environment={environment ?? defaultEnvironment}
          />
        ) : (
          <SquiggleErrorAlert error={result.value} />
        )}
      </SquiggleContainer>
    </div>
  );
};

export function renderSquiggleEditorToDom(props: SquiggleEditorProps) {
  const parent = document.createElement("div");
  ReactDOM.render(<SquiggleEditor {...props} />, parent);
  return parent;
}

export interface SquigglePartialProps {
  /** The input string for squiggle */
  initialSquiggleString?: string;
  /** when the environment changes. Used again for notebook magic*/
  onChange?(expr: bindings | undefined): void;
  /** Previously declared variables */
  bindings?: bindings;
  /** If the output requires monte carlo sampling, the amount of samples */
  environment?: environment;
  /** Variables imported from js */
  jsImports?: jsImports;
}

export const SquigglePartial: React.FC<SquigglePartialProps> = ({
  initialSquiggleString = "",
  onChange,
  bindings = defaultBindings,
  environment,
  jsImports = defaultImports,
}: SquigglePartialProps) => {
  const [code, setCode] = useState(initialSquiggleString);
  React.useEffect(
    () => setCode(initialSquiggleString),
    [initialSquiggleString]
  );

  const { result, observableRef } = useSquigglePartial({
    code,
    bindings,
    environment,
    jsImports,
    onChange,
  });

  return (
    <div ref={observableRef}>
      <SquiggleContainer>
        <WrappedCodeEditor code={code} setCode={setCode} />
        {result.tag !== "Ok" ? (
          <SquiggleErrorAlert error={result.value} />
        ) : null}
      </SquiggleContainer>
    </div>
  );
};

export function renderSquigglePartialToDom(props: SquigglePartialProps) {
  const parent = document.createElement("div");
  ReactDOM.render(<SquigglePartial {...props} />, parent);
  return parent;
}
