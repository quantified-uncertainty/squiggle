import _ from "lodash";
import React, { FC, useState } from "react";
import ReactDOM from "react-dom";
import { SquiggleChart } from "./SquiggleChart";
import CodeEditor from "./CodeEditor";
import { Form, Input, Row, Col } from "antd";
import styled from "styled-components";
import "antd/dist/antd.css";

interface FieldFloatProps {
  label: string;
  className?: string;
  value: number;
  onChange: (value: number) => void;
}

function FieldFloat(Props: FieldFloatProps) {
  let [contents, setContents] = useState(Props.value + "");
  return (
    <Form.Item label={Props.label}>
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
    </Form.Item>
  );
}

interface Props {
  initialSquiggleString?: string;
  height?: number;
}

interface Props2 {
  height: number;
}

const ShowBox = styled.div<Props2>`
  border: 1px solid #eee;
  border-radius: 2px;
  height: ${props => props.height};
`;

const MyComponent = styled.div`
  color: ${props => props.theme.colors.main};
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
  max-height: ${props => props.maxHeight}px;
`;

let SquigglePlayground: FC<Props> = ({ initialSquiggleString = "", height = 300 }: Props) => {
  let [squiggleString, setSquiggleString] = useState(initialSquiggleString);
  let [sampleCount, setSampleCount] = useState(1000);
  let [outputXYPoints, setOutputXYPoints] = useState(1000);
  let [pointDistLength, setPointDistLength] = useState(1000);
  let [diagramStart, setDiagramStart] = useState(0);
  let [diagramStop, setDiagramStop] = useState(10);
  let [diagramCount, setDiagramCount] = useState(20);
  return (
    <ShowBox height={height}>
      <Row>
        <Col span={12}>
          <CodeEditor
            value={squiggleString}
            onChange={setSquiggleString}
            oneLine={false}
            showGutter={true}
            height={height - 3}
          />
        </Col>
        <Col span={12}>
          <Display maxHeight={height-3}>
            <SquiggleChart
              squiggleString={squiggleString}
              sampleCount={sampleCount}
              outputXYPoints={outputXYPoints}
              diagramStart={diagramStart}
              diagramStop={diagramStop}
              diagramCount={diagramCount}
              pointDistLength={pointDistLength}
              height={150}
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
