import React, { useEffect } from 'react';
import { useSize } from 'react-use';
import { CdfChartD3 } from './distPlotD3';

/**
 * @param min
 * @param max
 * @returns {number}
 */
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @param props
 * @returns {*}
 * @constructor
 */
function CdfChartReact(props) {
  const containerRef = React.createRef();
  const key = "cdf-chart-react-" + getRandomInt(0, 1000);
  const scale = props.scale || 'linear';
  const style = !!props.width ? { width: props.width + "px" } : {};

  const [sized, { width }] = useSize(() => {
    return React.createElement("div", {
      key: "resizable-div",
    });
  }, {
    width: props.width,
  });

  useEffect(() => {
    new CdfChartD3()
      .svgWidth(width)
      .svgHeight(props.height)
      .maxX(props.maxX)
      .minX(props.minX)
      .onHover(props.onHover)
      .marginBottom(props.marginBottom || 15)
      .marginLeft(5)
      .marginRight(5)
      .marginTop(5)
      .showDistributionLines(props.showDistributionLines)
      .showDistributionYAxis(props.showDistributionYAxis)
      .verticalLine(props.verticalLine)
      .showVerticalLine(props.showVerticalLine)
      .container(containerRef.current)
      .data({
        continuous: props.continuous,
        discrete: props.discrete,
      })
      .scale(scale)
      .timeScale(props.timeScale)
      .render();
  });

  return React.createElement("div", {
    style: {
      paddingLeft: "10px",
      paddingRight: "10px",
    },
  }, [
    sized,
    React.createElement("div", {
      key,
      style,
      ref: containerRef,
    }),
  ]);
}

export default CdfChartReact;
