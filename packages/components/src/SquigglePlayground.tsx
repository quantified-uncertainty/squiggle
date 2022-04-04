import React, { FC, useState } from "react"
import ReactDOM from "react-dom"
import { SquiggleChart } from "./SquiggleChart"
import CodeEditor from "./CodeEditor"
import { Form, Input, Card, Row, Col } from "antd"
import 'antd/dist/antd.css';

interface FieldFloatProps {
  label : string,
  className? : string,
  value : number,
  onChange : (value: number) => void,
}

function FieldFloat(Props: FieldFloatProps) {
  let [contents, setContents] = useState(Props.value + "");
  return <Form.Item label={Props.label}>
    <Input 
      value={contents} 
      className={Props.className ? Props.className : ""}
      onChange={(e) => setContents(e.target.value)}
      onBlur={(_) => {
        let result = parseFloat(contents);
        if(result != NaN) {
          Props.onChange(result)
        }
      }}
      />
  </Form.Item> 
}

interface Props {
  initialSquiggleString : string
}

let SquigglePlayground : FC<Props> = (props) => {
  let [squiggleString, setSquiggleString] = useState(props.initialSquiggleString)
  let [sampleCount, setSampleCount] = useState(1000)
  let [outputXYPoints, setOutputXYPoints] = useState(1000)
  let [pointDistLength, setPointDistLength] = useState(1000)
  let [diagramStart, setDiagramStart] = useState(0)
  let [diagramStop, setDiagramStop] = useState(10)
  let [diagramCount, setDiagramCount] = useState(20)
  var demoDist = 
    <SquiggleChart
      squiggleString={squiggleString}
      sampleCount={sampleCount}
      outputXYPoints={outputXYPoints}
      diagramStart={diagramStart}
      diagramStop={diagramStop}
      diagramCount={diagramCount}
      pointDistLength={pointDistLength}
      />
  return (
    <Row>
      <Col span={12}>
        <Card
          title="Distribution Form">
          <Form>
            <Row gutter={16}>
              <Col span={24}> 
                <CodeEditor value={squiggleString} onChange={setSquiggleString} oneLine={false}/> </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}> 
                <FieldFloat 
                  value={sampleCount} 
                  label="Sample Count"
                  onChange={setSampleCount}
                  /> </Col>
              <Col span={12}>
                <FieldFloat
                  value={outputXYPoints}
                  onChange={setOutputXYPoints}
                  label="Output XY-points" />
              </Col>
              <Col span={12}>
                <FieldFloat 
                   value={pointDistLength}
                   onChange={setPointDistLength}
                   label="Downsample To"
                   />
              </Col>
              <Col span={12}>
                <FieldFloat 
                  value={diagramStart}
                  onChange={setDiagramStart}
                  label="Diagram Start"
                  />
              </Col>
              <Col span={12}> 
                <FieldFloat 
                  value={diagramStop}
                  onChange={setDiagramStop}
                  label="Diagram Stop"
                  /> </Col>
              <Col span={12}>
                <FieldFloat 
                  value={diagramCount}
                  onChange={setDiagramCount}
                  label="Diagram Count" 
                  />
              </Col>
            </Row>
          </Form>
        </Card>
      </Col>
      <Col span={12} >
        {demoDist}
      </Col>
    </Row>
  )
}
export default SquigglePlayground;
export function renderSquigglePlayground(props : Props){
  let parent = document.createElement("div");
  ReactDOM.render(
    <SquigglePlayground
      {...props}
    />,
    parent
  );
  return parent;
}
