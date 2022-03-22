import * as React  from 'react';
import * as ReactDOM  from 'react-dom';
import { SquiggleChart } from './SquiggleChart'
import { ReactCodeJar } from "react-codejar";
import type { exportEnv } from '@quri/squiggle-lang'


export interface SquiggleEditorProps {
  /** The input string for squiggle */
  initialSquiggleString? : string,
  
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
  diagramCount? : number,
  /** The environment, other variables that were already declared */
  environment?: exportEnv,
  /** when the environment changes. Used again for notebook magic*/
  onEnvChange?(env: exportEnv) : void
}

const highlight = (editor: HTMLInputElement) => {
  let code = editor.textContent;
  code = code.replace(/\((\w+?)(\b)/g, '(<font color="#8a2be2">$1</font>$2');
  editor.innerHTML = code;
};

interface SquiggleEditorState {
  expression: string,
  env: exportEnv
}

export class SquiggleEditor extends React.Component<SquiggleEditorProps, SquiggleEditorState>{
  constructor(props: SquiggleEditorProps) {
    super(props)
    let code = props.initialSquiggleString ? props.initialSquiggleString : ""
    this.state = {expression: code, env: props.environment }

  }
  render() {
    let {expression, env} = this.state
    let props = this.props
    return (
     <div>
      <ReactCodeJar 
        code={expression} 
        onUpdate={e => {
          this.setState({expression: e})
          }}
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
        environment={env}
        onEnvChange={props.onEnvChange}
        />
    </div>
    )
  }
}

export function renderSquiggleEditor(props : SquiggleEditorProps) {
  let parent = document.createElement("div")
  ReactDOM.render(<SquiggleEditor {...props} onEnvChange={env => {
    
    // I can set the value here because I need it for creating notebooks
    // @ts-ignore
    parent.value = env

    parent.dispatchEvent(new CustomEvent("input"))
    if(props.onEnvChange)
      props.onEnvChange(env)
    }} /> , parent)
  return parent
}
