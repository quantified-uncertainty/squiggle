import * as React  from 'react';
import * as PropTypes  from 'prop-types';
import * as _ from 'lodash';
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
    "domain": {
      "fields": [
        { "data": "con", "field": "x"},
        { "data": "dis", "field": "x"}
        ]
      }
  }, {
    "name": "yscale",
    "type": "linear",
    "range": "height",
    "nice": true,
    "zero": true,
    "domain": {
      "fields": [
        { "data": "con", "field": "y"},
        { "data": "dis", "field": "y"}
        ]
    }
  }
]


let specification : Spec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "A basic area chart example.",
  "width": 500,
  "height": 200,
  "padding": 5,
  "data": [{"name": "con"}, {"name": "dis"}],

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
      "from": {"data": "con"},
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
    },
    {
      "type": "rect",
      "from": {"data": "dis"},
      "encode": {
        "enter": {
          "x": {"scale": "xscale", "field": "x"},
          "y": {"scale": "yscale", "field": "y"},
          "y2": {"scale": "yscale", "value": 0},
          "width": {"value": 1}
        }
      }
    },
    {
      "type": "symbol",
      "from": {"data": "dis"},
      "encode": {
        "enter": {
          "shape": {"value": "circle"},
          "x": {"scale": "xscale", "field": "x"},
          "y": {"scale": "yscale", "field": "y"},
          "width": {"value": 5},
          "tooltip": {"signal": "datum.y"},
        }
      }
    }
  ]
};

let SquiggleVegaChart = createClassFromSpec({'spec': specification});

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
        let values = _.zip(cdf, xyShape.xs, xyShape.ys).map(([c, x, y ]) => ({cdf: (c * 100).toFixed(2) + "%", x: x, y: y}));

        return (
          <SquiggleVegaChart 
            data={{"con": values}}
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
        let values = _.zip(cdf, xyShape.xs, xyShape.ys).map(([c, x,y]) => ({cdf: (c * 100).toFixed(2) + "%", x: x, y: y}));

        return (
          <SquiggleVegaChart 
            data={{"dis": values}}
            />
        );
      }
      else if(shape.tag === "Mixed"){
        console.log(shape)
        console.log(shape.value.continuous.integralSumCache)
        let discreteShape = shape.value.discrete.xyShape;
        let totalDiscrete = discreteShape.ys.reduce((a, b) => a + b);

        let discretePoints = _.zip(discreteShape.xs, discreteShape.ys);
        let continuousShape = shape.value.continuous.xyShape;
        let continuousPoints = _.zip(continuousShape.xs, continuousShape.ys);

        interface labeledPoint {
          x: number,
          y: number,
          type: "discrete" | "continuous"
        };

        let markedDisPoints : labeledPoint[] = discretePoints.map(([x,y]) => ({x: x, y: y, type: "discrete"}))
        let markedConPoints : labeledPoint[] = continuousPoints.map(([x,y]) => ({x: x, y: y, type: "continuous"}))

        let sortedPoints = _.sortBy(markedDisPoints.concat(markedConPoints), 'x')

        let totalContinuous = 1 - totalDiscrete;
        let totalY = continuousShape.ys.reduce((a:number, b:number) => a + b);

        let total = 0;
        let cdf = sortedPoints.map((point: labeledPoint) => {
          if(point.type == "discrete") {
            total += point.y;
            return total;
          }
          else if (point.type == "continuous") {
            total += point.y / totalY * totalContinuous;
            return total;
          }
        });

        interface cdfLabeledPoint {
          cdf: string,
          x: number,
          y: number,
          type: "discrete" | "continuous"
        }
        let cdfLabeledPoint : cdfLabeledPoint[] = _.zipWith(cdf, sortedPoints, (c: number, point: labeledPoint) => ({...point, cdf: (c * 100).toFixed(2) + "%"}))
        let continuousValues = cdfLabeledPoint.filter(x => x.type == "continuous")
        let discreteValues = cdfLabeledPoint.filter(x => x.type == "discrete")

        return (
          <SquiggleVegaChart 
            data={{"con": continuousValues, "dis": discreteValues}}
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

