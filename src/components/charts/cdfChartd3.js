import * as d3 from 'd3';

function chart() {
  // Id for event handlings.
  const attrs = {
    id: 'ID' + Math.floor(Math.random() * 1000000),
    svgWidth: 400,
    svgHeight: 400,

    marginTop: 5,
    marginBottom: 5,
    marginRight: 50,
    marginLeft: 5,

    container: 'body',
    minX: false,
    maxX: false,
    scale: 'linear',
    showDistributionLines: true,
    areaColors: ['#E1E5EC', '#E1E5EC'],
    logBase: 10,
    verticalLine: 110,
    showVerticalLine: true,
    data: null,
    onHover: (e) => {
    },
  };

  function main() {
    const container = d3.select(attrs.container);

    if (container.node() === null) {
      return;
    }

    const containerRect = container.node().getBoundingClientRect();
    if (containerRect.width > 0) {
      attrs.svgWidth = containerRect.width;
    }

    // Calculated properties.
    // id for event handlings.
    const calc = {};
    calc.id = 'ID' + Math.floor(Math.random() * 1000000);
    calc.chartLeftMargin = attrs.marginLeft;
    calc.chartTopMargin = attrs.marginTop;
    calc.chartWidth = attrs.svgWidth - attrs.marginRight - attrs.marginLeft;
    calc.chartHeight = attrs.svgHeight - attrs.marginBottom - attrs.marginTop;

    const areaColor = d3.scaleOrdinal().range(attrs.areaColors);

    const dataPoints = [getDatapoints('primary')];

    // Scales.
    let xScale;

    const xMin = d3.min(attrs.data.primary.xs);
    const xMax = d3.max(attrs.data.primary.xs);

    if (attrs.scale === 'linear') {
      xScale = d3.scaleLinear()
        .domain([
          attrs.minX || xMin,
          attrs.maxX || xMax
        ])
        .range([0, calc.chartWidth]);
    } else {
      xScale = d3.scaleLog()
        .base(attrs.logBase)
        .domain([attrs.minX, attrs.maxX])
        .range([0, calc.chartWidth]);
    }

    const yMin = d3.min(attrs.data.primary.ys);
    const yMax = d3.max(attrs.data.primary.ys);

    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([calc.chartHeight, 0]);

    // Axis generator.
    const xAxis = d3.axisBottom(xScale)
      .ticks(3)
      .tickFormat(d => {
        if (Math.abs(d) < 1) {
          return d3.format(".2")(d);
        } else if (xMin > 1000 && xMax < 3000) {
          // Condition which identifies years; 2019, 2020, 2021.
          return d3.format(".0")(d);
        } else {
          const prefix = d3.formatPrefix(".0", d);
          const output = prefix(d);
          return output.replace("G", "B");
        }
      });

    // Line generator.
    const line = d3.line()
      .x(function (d, i) {
        return xScale(d.x);
      })
      .y(function (d, i) {
        return yScale(d.y);
      });

    const area = d3.area()
      .x(function (d, i) {
        return xScale(d.x);
      })
      .y1(function (d, i) {
        return yScale(d.y);
      })
      .y0(calc.chartHeight);

    // Add svg.
    const svg = container
      .patternify({ tag: 'svg', selector: 'svg-chart-container' })
      .attr('width', "100%")
      .attr('height', attrs.svgHeight)
      .attr('pointer-events', 'none');

    // Add container g element.
    const chart = svg
      .patternify({ tag: 'g', selector: 'chart' })
      .attr(
        'transform',
        'translate(' + calc.chartLeftMargin + ',' + calc.chartTopMargin + ')',
      );

    // Add axis.
    chart.patternify({ tag: 'g', selector: 'axis' })
      .attr('transform', 'translate(' + 0 + ',' + calc.chartHeight + ')')
      .call(xAxis);

    // Draw area.
    chart
      .patternify({
        tag: 'path',
        selector: 'area-path',
        data: dataPoints
      })
      .attr('d', area)
      .attr('fill', (d, i) => areaColor(i))
      .attr('opacity', (d, i) => i === 0 ? 0.7 : 0.5);

    // Draw line.
    if (attrs.showDistributionLines) {
      chart
        .patternify({
          tag: 'path',
          selector: 'line-path',
          data: dataPoints
        })
        .attr('d', line)
        .attr('id', (d, i) => 'line-' + (i + 1))
        .attr('opacity', (d, i) => {
          return i === 0 ? 0.7 : 1
        })
        .attr('fill', 'none');
    }

    if (attrs.showVerticalLine) {
      chart.patternify({ tag: 'line', selector: 'v-line' })
        .attr('x1', xScale(attrs.verticalLine))
        .attr('x2', xScale(attrs.verticalLine))
        .attr('y1', 0)
        .attr('y2', calc.chartHeight)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6 6')
        .attr('stroke', 'steelblue');
    }

    const hoverLine = chart.patternify({ tag: 'line', selector: 'hover-line' })
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', calc.chartHeight)
      .attr('opacity', 0)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6 6')
      .attr('stroke', '#22313F');

    // Add drawing rectangle.
    chart.patternify({ tag: 'rect', selector: 'mouse-rect' })
      .attr('width', calc.chartWidth)
      .attr('height', calc.chartHeight)
      .attr('fill', 'transparent')
      .attr('pointer-events', 'all')
      .on('mouseover', mouseover)
      .on('mousemove', mouseover)
      .on('mouseout', mouseout);

    function mouseover() {
      const mouse = d3.mouse(this);

      hoverLine.attr('opacity', 1)
        .attr('x1', mouse[0])
        .attr('x2', mouse[0]);

      const range = [
        xScale(dataPoints[dataPoints.length - 1][0].x),
        xScale(
          dataPoints
            [dataPoints.length - 1]
            [dataPoints[dataPoints.length - 1].length - 1].x,
        ),
      ];

      const xValue = xScale.invert(mouse[0]).toFixed(2);

      if (mouse[0] > range[0] && mouse[0] < range[1]) {
        attrs.onHover(xValue);
      } else {
        attrs.onHover(0.0);
      }
    }

    function mouseout() {
      hoverLine.attr('opacity', 0)
    }

    /**
     * @param key
     * @returns {[]}
     */
    function getDatapoints(key) {
      const dt = [];
      const data = attrs.data[key];
      const len = data.xs.length;

      for (let i = 0; i < len; i++) {
        dt.push({
          x: data.xs[i],
          y: data.ys[i]
        })
      }

      return dt;
    }
  }

  d3.selection.prototype.patternify = function patternify(params) {
    const container = this;
    const selector = params.selector;
    const elementTag = params.tag;
    const data = params.data || [selector];

    // Pattern in action.
    const selection = container.selectAll('.' + selector).data(data, (d, i) => {
      if (typeof d === 'object') {
        if (d.id) {
          return d.id;
        }
      }
      return i;
    });

    selection.exit().remove();
    const selection2 = selection.enter().append(elementTag).merge(selection);
    selection2.attr('class', selector);
    return selection2;
  };

  // @todo: Do not do like that.
  // @todo: Dynamic keys functions.
  // @todo: Attach variables to main function.
  Object.keys(attrs).forEach((key) => {
    main[key] = function (_) {
      if (!arguments.length) {
        return attrs[key];
      }
      attrs[key] = _;
      return main;
    };
  });

  // Set attrs as property.
  main.attrs = attrs;

  // Exposed update functions.
  main.data = function data(value) {
    if (!arguments.length) return attrs.data;
    attrs.data = value;
    return main;
  };

  // Run visual.
  main.render = function render() {
    main();
    return main;
  };

  return main;
}

export default chart;
