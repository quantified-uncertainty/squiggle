import React from "react";
import { CodeEditor } from "./CodeEditor";
import { SquiggleContainer } from "./SquiggleContainer";
import {
  splitSquiggleChartSettings,
  SquiggleChartProps,
} from "./SquiggleChart";
import { useMaybeControlledValue, useSquiggle } from "../lib/hooks";
import { JsImports } from "../lib/jsImports";
import { defaultEnvironment, SqLocation, SqProject } from "@quri/squiggle-lang";
import { SquiggleViewer } from "./SquiggleViewer";
import { getErrorLocations, getValueToRender } from "../lib/utility";

const WrappedCodeEditor: React.FC<{
  code: string;
  setCode: (code: string) => void;
  errorLocations?: SqLocation[];
}> = ({ code, setCode, errorLocations }) => (
  <div className="border border-grey-200 p-2 m-4">
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

export type SquiggleEditorProps = SquiggleChartProps & {
  defaultCode?: string;
  onCodeChange?: (code: string) => void;
};

const defaultOnChange = () => {};
const defaultImports: JsImports = {};

export const SquiggleEditor: React.FC<SquiggleEditorProps> = (props) => {
  const [code, setCode] = useMaybeControlledValue({
    value: props.code,
    defaultValue: props.defaultCode ?? "",
    onChange: props.onCodeChange,
  });

  const { distributionPlotSettings, chartSettings } =
    splitSquiggleChartSettings(props);

  const {
    environment,
    jsImports = defaultImports,
    onChange = defaultOnChange, // defaultOnChange must be constant, don't move its definition here
    executionId = 0,
    width,
    height = 200,
    numberPrecision,
    enableLocalSettings = false,
  } = props;

  const project = React.useMemo(() => {
    const p = SqProject.create();
    if (environment) {
      p.setEnvironment(environment);
    }
    return p;
  }, [environment]);

  const resultAndBindings = useSquiggle({
    code,
    project,
    jsImports,
    onChange,
    executionId,
  });

  const valueToRender = getValueToRender(resultAndBindings);
  const errorLocations = getErrorLocations(resultAndBindings.result);

  return (
    <SquiggleContainer>
      <WrappedCodeEditor
        code={code}
        setCode={setCode}
        errorLocations={errorLocations}
      />
      <SquiggleViewer
        result={valueToRender}
        width={width}
        height={height}
        numberPrecision={numberPrecision}
        distributionPlotSettings={distributionPlotSettings}
        chartSettings={chartSettings}
        environment={environment ?? defaultEnvironment}
        enableLocalSettings={enableLocalSettings}
      />
    </SquiggleContainer>
  );
};
