import _ from "lodash";
import React, { FC, ReactElement, useState } from "react";
import ReactDOM from "react-dom";
import { SquiggleChart } from "./SquiggleChart";
import CodeEditor from "./CodeEditor";
import styled from "styled-components";
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

interface Props {
  initialSquiggleString?: string;
  height?: number;
  showTypes?: boolean;
  showControls?: boolean;
}

interface Props2 {
  height: number;
}

const ShowBox = styled.div<Props2>`
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

const Row = styled.div`
  display: grid;
  grid-template-columns: 50% 50%;
`;
const Col = styled.div``;

let SquigglePlayground: FC<Props> = ({
  initialSquiggleString = "",
  height = 300,
  showTypes = false,
  showControls = false,
}: Props) => {
  let [squiggleString, setSquiggleString] = useState(initialSquiggleString);
  let [sampleCount, setSampleCount] = useState(1000);
  let [outputXYPoints, setOutputXYPoints] = useState(1000);
  let [pointDistLength, setPointDistLength] = useState(1000);
  let [diagramStart, setDiagramStart] = useState(0);
  let [diagramStop, setDiagramStop] = useState(10);
  let [diagramCount, setDiagramCount] = useState(20);
  let chartSettings = {
    start: diagramStart,
    stop: diagramStop,
    count: diagramCount,
  };
  let env: environment = {
    sampleCount: sampleCount,
    xyPointLength: outputXYPoints,
  };
  return (
    <ShowBox height={height}>
      <Row>
        <Col>
          <CodeEditor
            value={squiggleString}
            onChange={setSquiggleString}
            oneLine={false}
            showGutter={true}
            height={height - 3}
          />
        </Col>
        <Col>
          <Display maxHeight={height - 3}>
            <SquiggleChart
              squiggleString={squiggleString}
              environment={env}
              chartSettings={chartSettings}
              height={150}
              showTypes={showTypes}
              showControls={showControls}
              bindings={defaultBindings}
              jsImports={defaultImports}
            />
          </Display>
        </Col>
      </Row>
    </ShowBox>
  );
};
export default SquigglePlayground;
export function renderSquigglePlaygroundToDom(props: Props) {
  let parent = document.createElement("div");
  ReactDOM.render(<SquigglePlayground {...props} />, parent);
  return parent;
}
