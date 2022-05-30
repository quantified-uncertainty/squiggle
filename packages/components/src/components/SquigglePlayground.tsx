import _ from "lodash";
import React, { FC, ReactElement, useState } from "react";
import ReactDOM from "react-dom";
import { SquiggleChart } from "./SquiggleChart";
import CodeEditor from "./CodeEditor";
import JsonEditor from "./JsonEditor";
import { useForm, useWatch } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { defaultBindings, environment } from "@quri/squiggle-lang";

interface ShowBoxProps {
  height: number;
  children: React.ReactNode;
}

const ShowBox: React.FC<ShowBoxProps> = ({ height, children }) => (
  <div className="border border-grey-100" style={{ height: height + "px" }}>
    {children}
  </div>
);

interface TitleProps {
  readonly maxHeight: number;
  children: React.ReactNode;
}

const Display: React.FC<TitleProps> = ({ maxHeight, children }) => (
  <div
    className="bg-gray-50 border-l border-grey-100 p-2"
    style={{ maxHeight: maxHeight + "px" }}
  >
    {children}
  </div>
);

interface PlaygroundProps {
  /** The initial squiggle string to put in the playground */
  initialSquiggleString?: string;
  /** How many pixels high is the playground */
  height?: number;
  /** Whether to show the types of outputs in the playground */
  showTypes?: boolean;
  /** Whether to show the log scale controls in the playground */
  showControls?: boolean;
  /** Whether to show the summary table in the playground */
  showSummary?: boolean;
}

const schema = yup
  .object()
  .shape({
    sampleCount: yup
      .number()
      .required()
      .positive()
      .integer()
      .default(1000)
      .min(10)
      .max(1000000),
    xyPointLength: yup
      .number()
      .required()
      .positive()
      .integer()
      .default(1000)
      .min(10)
      .max(10000),
    chartHeight: yup.number().required().positive().integer().default(350),
    leftSizePercent: yup
      .number()
      .required()
      .positive()
      .integer()
      .min(10)
      .max(100)
      .default(50),
    showTypes: yup.boolean(),
    showControls: yup.boolean(),
    showSummary: yup.boolean(),
    showSettingsPage: yup.boolean().default(false),
  })
  .required();

type InputProps = {
  label: string;
  children: ReactElement;
};

const InputItem: React.FC<InputProps> = ({ label, children }) => (
  <div>
    <label>{label}</label>
    {children}
  </div>
);

let SquigglePlayground: FC<PlaygroundProps> = ({
  initialSquiggleString = "",
  height = 500,
  showTypes = false,
  showControls = false,
  showSummary = false,
}: PlaygroundProps) => {
  let [squiggleString, setSquiggleString] = useState(initialSquiggleString);
  let [importString, setImportString] = useState("{}");
  let [imports, setImports] = useState({});
  let [importsAreValid, setImportsAreValid] = useState(true);
  let [diagramStart, setDiagramStart] = useState(0);
  let [diagramStop, setDiagramStop] = useState(10);
  let [diagramCount, setDiagramCount] = useState(20);
  let chartSettings = {
    start: diagramStart,
    stop: diagramStop,
    count: diagramCount,
  };
  const { register, control } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      sampleCount: 1000,
      xyPointLength: 1000,
      chartHeight: 150,
      showTypes: showTypes,
      showControls: showControls,
      showSummary: showSummary,
      leftSizePercent: 50,
      showSettingsPage: false,
    },
  });
  const vars = useWatch({
    control,
  });
  let env: environment = {
    sampleCount: Number(vars.sampleCount),
    xyPointLength: Number(vars.xyPointLength),
  };
  let getChangeJson = (r: string) => {
    setImportString(r);
    try {
      setImports(JSON.parse(r));
      setImportsAreValid(true);
    } catch (e) {
      setImportsAreValid(false);
    }
  };
  return (
    <ShowBox height={height}>
      <input type="checkbox" {...register("showSettingsPage")} />
      <div className="columns-2">
        <div className="break-inside-avoid">
          {vars.showSettingsPage ? (
            <>
              <InputItem label="Sample Count">
                <input type="number" {...register("sampleCount")} />
              </InputItem>
              <InputItem label="XYPointLength Count">
                <input type="number" {...register("xyPointLength")} />
              </InputItem>
              <InputItem label="Chart Height (in Pixels)">
                <input type="number" {...register("chartHeight")} />
              </InputItem>
              <InputItem label="Show Types">
                <input type="checkbox" {...register("showTypes")} />
              </InputItem>
              <InputItem label="Show Controls">
                <input type="checkbox" {...register("showControls")} />
              </InputItem>
              <InputItem label="Show Summary Statistics">
                <input type="checkbox" {...register("showSummary")} />
              </InputItem>
              <InputItem label="Editor Width">
                <input
                  type="range"
                  min="1"
                  max="100"
                  className="slider"
                  {...register("leftSizePercent")}
                />
              </InputItem>
              <InputItem label="Json Editor for imports">
                <>
                  <JsonEditor
                    value={importString}
                    onChange={getChangeJson}
                    oneLine={false}
                    showGutter={true}
                    height={100}
                  />
                  {importsAreValid ? "Valid" : "Invalid"}
                </>
              </InputItem>
            </>
          ) : (
            <CodeEditor
              value={squiggleString}
              onChange={setSquiggleString}
              oneLine={false}
              showGutter={true}
              height={height - 3}
            />
          )}
        </div>
        <div>
          <Display maxHeight={height - 3}>
            <SquiggleChart
              squiggleString={squiggleString}
              environment={env}
              chartSettings={chartSettings}
              height={vars.chartHeight}
              showTypes={vars.showTypes}
              showControls={vars.showControls}
              bindings={defaultBindings}
              jsImports={imports}
              showSummary={vars.showSummary}
            />
          </Display>
        </div>
      </div>
    </ShowBox>
  );
};
export default SquigglePlayground;
export function renderSquigglePlaygroundToDom(props: PlaygroundProps) {
  let parent = document.createElement("div");
  ReactDOM.render(<SquigglePlayground {...props} />, parent);
  return parent;
}
