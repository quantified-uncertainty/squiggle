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
 * @todo: To rename as "DistPlotReact".
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
      .set('svgWidth', width)
      .set('svgHeight', props.height)
      .set('maxX', props.maxX)
      .set('minX', props.minX)
      .set('onHover', props.onHover)
      .set('marginBottom',props.marginBottom || 15)
      .set('marginLeft', 30)
      .set('marginRight', 30)
      .set('marginTop', 5)
      .set('showDistributionLines', props.showDistributionLines)
      .set('showDistributionYAxis', props.showDistributionYAxis)
      .set('verticalLine', props.verticalLine || 110)
      .set('showVerticalLine', props.showVerticalLine)
      .set('container', containerRef.current)
      .set('scale', scale)
      .set('timeScale', props.timeScale)
      .set('yMaxContinuousDomainFactor', props.yMaxContinuousDomainFactor || 1)
      .set('yMaxDiscreteDomainFactor', props.yMaxDiscreteDomainFactor || 1)
      .data({
        continuous: props.continuous,
        discrete: props.discrete,
      })
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
