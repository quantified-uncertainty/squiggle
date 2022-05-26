import _ from "lodash";
import React, { FC, ReactElement, useState } from "react";
import ReactDOM from "react-dom";
import { SquiggleChart } from "./SquiggleChart";
import CodeEditor from "./CodeEditor";
import JsonEditor from "./JsonEditor";
import styled from "styled-components";
import { useForm, useWatch } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  defaultBindings,
  environment,
  defaultImports,
} from "@quri/squiggle-lang";

interface FieldFloatProps {
  label: string;
  className?: string;
  value: number;
  onChange: (value: number) => void;
}

const Input = styled.input``;

const FormItem = (props: { label: string; children: ReactElement }) => (
  <div>
    <label>{props.label}</label>
    {props.children}
  </div>
);

function FieldFloat(Props: FieldFloatProps) {
  let [contents, setContents] = useState(Props.value + "");
  return (
    <FormItem label={Props.label}>
      <Input
        value={contents}
        className={Props.className ? Props.className : ""}
        onChange={(e) => {
          setContents(e.target.value);
          let result = parseFloat(contents);
          if (_.isFinite(result)) {
            Props.onChange(result);
          }
        }}
      />
    </FormItem>
  );
}

interface ShowBoxProps {
  height: number;
}

const ShowBox = styled.div<ShowBoxProps>`
  border: 1px solid #eee;
  border-radius: 2px;
  height: ${(props) => props.height};
`;

interface TitleProps {
  readonly maxHeight: number;
}

const Display = styled.div<TitleProps>`
  background: #f6f6f6;
  border-left: 1px solid #eee;
  height: 100vh;
  padding: 3px;
  overflow-y: auto;
  max-height: ${(props) => props.maxHeight}px;
`;

interface RowProps {
  readonly leftPercentage: number;
}

const Row = styled.div<RowProps>`
  display: grid;
  grid-template-columns: ${(p) => p.leftPercentage}% ${(p) =>
      100 - p.leftPercentage}%;
`;
const Col = styled.div``;

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

let SquigglePlayground: FC<PlaygroundProps> = ({
  initialSquiggleString = "",
  height = 300,
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
  const {
    register,
    formState: { errors },
    control,
  } = useForm({
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
      <Row leftPercentage={vars.leftSizePercent || 50}>
        <Col>
          {vars.showSettingsPage ? (
            <div>
              <input type="number" {...register("sampleCount")} />
              <input type="number" {...register("xyPointLength")} />
              <input type="number" {...register("chartHeight")} />
              <input type="number" {...register("leftSizePercent")} />
              <input type="checkbox" {...register("showTypes")} />
              <input type="checkbox" {...register("showControls")} />
              <input type="checkbox" {...register("showSummary")} />
              <JsonEditor
                value={importString}
                onChange={getChangeJson}
                oneLine={false}
                showGutter={true}
                height={100}
              />
              {importsAreValid ? "Valid" : "Invalid"}
            </div>
          ) : (
            <CodeEditor
              value={squiggleString}
              onChange={setSquiggleString}
              oneLine={false}
              showGutter={true}
              height={height - 3}
            />
          )}
        </Col>
        <Col>
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
        </Col>
      </Row>
    </ShowBox>
  );
};
export default SquigglePlayground;
export function renderSquigglePlaygroundToDom(props: PlaygroundProps) {
  let parent = document.createElement("div");
  ReactDOM.render(<SquigglePlayground {...props} />, parent);
  return parent;
}
