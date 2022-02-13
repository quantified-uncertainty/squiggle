import * as React  from 'react';
import * as PropTypes  from 'prop-types';
import './button.css';
import type { LinearScale, Spec } from 'vega';
import { run } from '@squiggle/squiggle-lang';
import { createClassFromSpec } from 'react-vega';

let scales : LinearScale[] = [{
    "name": "xscale",
    "type": "linear",
    "range": "width",
    "zero": false,
    "nice": false,
    "domain": 
      {"data": "table", "field": "x"}
  }, {
    "name": "yscale",
    "type": "linear",
    "range": "height",
    "nice": true,
    "zero": true,
    "domain": 
      {"data": "table", "field": "y"}
  }
]


let specification : Spec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "A basic area chart example.",
  "width": 500,
  "height": 200,
  "padding": 5,
  "data": [{"name": "table"}],

  "signals": [
    {
      "name": "mousex",
      "description": "x position of mouse",
      "update": "0",
      "on": [{"events": "mousemove", "update": "1-x()/width"}]
    }
  ],

  "scales": scales,

  "axes": [
    {"orient": "bottom", "scale": "xscale", "tickCount": 20},
    {"orient": "left", "scale": "yscale"}
  ],

  "marks": [
    {
      "type": "area",
      "from": {"data": "table"},
      "encode": {
        "enter": {
          "x": {"scale": "xscale", "field": "x"},
          "y": {"scale": "yscale", "field": "y"},
          "y2": {"scale": "yscale", "value": 0},
          "tooltip": {"signal": "datum.cdf"}
        },
        "update": {
          "fill": {
              "signal": "{gradient: 'linear', x1: 1, y1: 1, x2: 0, y2: 1, stops: [ {offset: 0.0, color: 'steelblue'}, {offset: clamp(mousex, 0, 1), color: 'steelblue'}, {offset: clamp(mousex, 0, 1), color: 'blue'}, {offset: 1.0, color: 'blue'} ] }"
            },
          "interpolate": {"value": "monotone"},
          "fillOpacity": {"value": 1}
        }
      }
    }
  ]
};

let SquiggleVegaChart = createClassFromSpec({'spec': specification});

function zip<T>(a: Array<T>, b: Array<T>): Array<Array<T>>{
  return a.map(function(e, i) {
    return [e, b[i]];
  })
}
function zip3<T>(a: Array<T>, b: Array<T>, c: Array<T>): Array<Array<T>>{
  return a.map(function(e, i) {
    return [e, b[i], c[i]];
  })
}
/**
 * Primary UI component for user interaction
 */
export const SquiggleChart = ({ squiggleString }: { squiggleString: string}) => {
  let result = run(squiggleString);
  console.log(result);
  if (result.tag === "Ok") {
    let chartResult = result.value[0];
    if(chartResult["NAME"] === "Float"){
      return <div>{chartResult["VAL"]}</div>;
    }
    else if(chartResult["NAME"] === "DistPlus"){
      let shape = chartResult.VAL.shape;
      if(shape.tag === "Continuous"){
        let xyShape = shape.value.xyShape;
        let totalY = xyShape.ys.reduce((a, b) => a + b);
        let total = 0;
        let cdf = xyShape.ys.map(y => {
          total += y;
          return total / totalY;
        })
        console.log(cdf)
        let values = zip3(cdf, xyShape.xs, xyShape.ys).map(([c, x, y ]) => ({cdf: (c * 100).toFixed(2) + "%", x: x, y: y}));

        return (
          <SquiggleVegaChart 
            data={{"table": values}}
            />
        );
      }
      else if(shape.tag === "Discrete"){
        let xyShape = shape.value.xyShape;
        let totalY = xyShape.ys.reduce((a, b) => a + b);
        let total = 0;
        let cdf = xyShape.ys.map(y => {
          total += y;
          return total / totalY;
        })
        let values = zip3(cdf, xyShape.xs, xyShape.ys).map(([c, x,y]) => ({cdf: (c * 100).toFixed(2) + "%", x: x, y: y}));

        return (
          <SquiggleVegaChart 
            data={{"name": "table", "values": values}}
            />
        );
      }
      else if(shape.tag === "Mixed"){
        console.log(shape.value.integralSumCache)
        console.log(shape.value.integralCache)
        let xyShape = shape.value.continuous.xyShape;
        let values = zip(xyShape.xs, xyShape.ys).map(([x,y]) => ({x: x, y: y}));

        return (
          <SquiggleVegaChart 
            data={{"name": "table", "values": values}}
            />
        );
        }
    }
    else if(chartResult.NAME === "Function"){

    }
  }
  else if(result.tag == "Error") {
    // At this point, we came across an error. What was our error?
    return (<p>{"Error parsing Squiggle: " + result.value}</p>)

  }
  return (<p>{"Invalid Response"}</p>)
};

SquiggleChart.propTypes = {
 /**
  * Squiggle String
  */
 squiggleString : PropTypes.string
};

SquiggleChart.defaultProps = {
squggleString: "normal(5, 2)"

};

