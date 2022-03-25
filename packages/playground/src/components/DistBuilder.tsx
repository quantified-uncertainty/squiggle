import { FC, useState } from "react"
import { SquiggleChart } from "@quri/squiggle-components"
import { CodeEditor } from "./CodeEditor"
import { Form, Input, Card, Row, Col } from "antd"
import { css } from '@emotion/react'

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
let rows = css`
  >.antCol:firstChild {
    paddingLeft: 0.25em;
    paddingRight: 0.125em;
  }
  >.antCol:lastChild {
    paddingLeft: 0.125em;
    paddingRight: 0.25em;
  }
  >.antCol:not(:lastChild):not(:lastChild) {
    paddingLeft: 0.125em;
    paddingRight: 0.125em;
  }
  `

let parent = css`
  .antImportNumber {
    width: 100%;
  }

  .anticon {
    verticalAlign: "zero";
  }
  `
var form = css`
  backgroundColor: #eee;
  padding: 1em;
  `
var dist = css`
  padding: 1em;
  `

var spacer = css`
  marginTop: 1em;
  `

var groupA = css`
  .antInputNumberInputs {
    backgroundColor: #fff7db;
  }
  `

var groupB = css`
  .antInputNumberInput {
    backgroundColor: #eaf4ff;
  }
  `

var Styles = {
  rows: rows,
  parent: parent,
  form: form,
  dist: dist,
  spacer: spacer,
  groupA: groupA,
  groupB: groupB
};

let DistBuilder : FC<{}> = (_: {}) => {
  let [squiggleString, setSquiggleString] = useState("mm(normal(5,2), normal(10,2))")
  let [sampleCount, setSampleCount] = useState(1000)
  let [outputXYPoints, setOutputXYPoints] = useState(1000)
  let [pointDistLength, setPointDistLength] = useState(undefined)
  let [kernelWidth, setKernelWidth] = useState(undefined)
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
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Card
          title="Distribution Form">
          <Form>
            <Row css={Styles.rows}>
              <Col span={24}> 
                <CodeEditor value={squiggleString} onChange={setSquiggleString} /> </Col>
            </Row>
            <Row css={Styles.rows}>
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
                  value={kernelWidth}
                  onChange={setKernelWidth}
                  label="Kernel Width" 
                  /> </Col>
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
      </div>
        {demoDist}
    </div>
  )
}
export default DistBuilder
