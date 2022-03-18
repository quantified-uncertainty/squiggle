import * as React  from 'react';
import * as ReactDOM  from 'react-dom';
import { SquiggleChart } from './SquiggleChart'
import { ReactCodeJar } from "react-codejar";


export interface SquiggleEditorProps {
  /** The input string for squiggle */
  initialSquiggleString : string,
  
  /** If the output requires monte carlo sampling, the amount of samples */
  sampleCount? : number,
  /** The amount of points returned to draw the distribution */
  outputXYPoints? : number,
  kernelWidth? : number,
  pointDistLength? : number,
  /** If the result is a function, where the function starts */
  diagramStart? : number,
  /** If the result is a function, where the function ends */
  diagramStop? : number,
  /** If the result is a function, how many points along the function it samples */
  diagramCount? : number
}

const highlight = (editor: HTMLInputElement) => {
  let code = editor.textContent;
  code = code.replace(/\((\w+?)(\b)/g, '(<font color="#8a2be2">$1</font>$2');
  editor.innerHTML = code;
};

export const SquiggleEditor : React.FC<SquiggleEditorProps> = props => {
  let [expression, setExpression] = React.useState(props.initialSquiggleString)
  return (
   <div>
    <ReactCodeJar 
      code={expression} 
      onUpdate={setExpression}
      style={{
    borderRadius: "6px",
    width: "530px",
    border: "1px solid grey",
    fontFamily: "'Source Code Pro', monospace",
    fontSize: "14px",
    fontWeight: "400",
    letterSpacing: "normal",
    lineHeight: "20px",
    padding: "10px",
    tabSize: "4"
}}
      highlight={highlight}
      lineNumbers={false}
      /> 
    <SquiggleChart 
      squiggleString={expression}
      sampleCount={props.sampleCount}
      outputXYPoints={props.outputXYPoints}
      kernelWidth={props.kernelWidth}
      pointDistLength={props.pointDistLength}
      diagramStart={props.diagramStart}
      diagramStop={props.diagramStop}
      diagramCount={props.diagramCount}
      />
  </div>
  )
}

export function renderSquiggleEditor(props : SquiggleEditorProps) {
  let parent = document.createElement("div")
  ReactDOM.render(<SquiggleEditor {...props} /> , parent)
  return parent
}
