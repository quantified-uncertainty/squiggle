import * as d3 from 'd3';

function chart() {
  // Id for event handlings.
  var attrs = {
    id: 'ID' + Math.floor(Math.random() * 1000000),
    svgWidth: 400,
    svgHeight: 400,

    marginTop: 5,
    marginBottom: 5,
    marginRight: 5,
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

  var main = function main() {
    // Drawing containers.
    var container = d3.select(attrs.container);

    if (container.node() === null) {
      return;
    }

    var containerRect = container.node().getBoundingClientRect();
    if (containerRect.width > 0) {
      attrs.svgWidth = containerRect.width;
    }

    // Calculated properties.
    // id for event handlings.
    var calc = {};
    calc.id = 'ID' + Math.floor(Math.random() * 1000000);
    calc.chartLeftMargin = attrs.marginLeft;
    calc.chartTopMargin = attrs.marginTop;
    calc.chartWidth = attrs.svgWidth - attrs.marginRight - attrs.marginLeft;
    calc.chartHeight = attrs.svgHeight - attrs.marginBottom - attrs.marginTop;

    var areaColor = d3.scaleOrdinal().range(attrs.areaColors);

    var dataPoints = [getDatapoints('primary')];

    // Scales.
    var xScale;

    var xMin = d3.min(attrs.data.primary.xs);
    var xMax = d3.max(attrs.data.primary.xs);

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
        .domain([
          attrs.minX,
          attrs.maxX,
        ])
        .range([0, calc.chartWidth]);
    }

    var yMin = d3.min(attrs.data.primary.ys);
    var yMax = d3.max(attrs.data.primary.ys);

    var yScale = d3.scaleLinear()
      .domain([
        yMin,
        yMax,
      ])
      .range([calc.chartHeight, 0]);

    // Axis generator.
    var xAxis = d3.axisBottom(xScale)
      .ticks(3)
      .tickFormat(d => {
        if (Math.abs(d) < 1) {
          return d3.format(".2")(d);
        } else if (xMin > 1000 && xMax < 3000) {
          // Condition which identifies years; 2019, 2020, 2021.
          return d3.format(".0")(d);
        } else {
          var prefix = d3.formatPrefix(".0", d);
          var output = prefix(d);
          return output.replace("G", "B");
        }
      });

    // Line generator.
    var line = d3.line()
      .x(function (d, i) {
        return xScale(d.x);
      })
      .y(function (d, i) {
        return yScale(d.y);
      });

    var area = d3.area()
      .x(function (d, i) {
        return xScale(d.x);
      })
      .y1(function (d, i) {
        return yScale(d.y);
      })
      .y0(calc.chartHeight);

    // Add svg.
    var svg = container
      .patternify({ tag: 'svg', selector: 'svg-chart-container' })
      .attr('width', "100%")
      .attr('height', attrs.svgHeight)
      .attr('pointer-events', 'none');

    // Add container g element.
    var chart = svg
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
      .attr('opacity', (d, i) => i === 0 ? 0.7 : 1);

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

    var hoverLine = chart.patternify({ tag: 'line', selector: 'hover-line' })
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
      var mouse = d3.mouse(this);

      hoverLine.attr('opacity', 1)
        .attr('x1', mouse[0])
        .attr('x2', mouse[0]);

      var range = [
        xScale(dataPoints[dataPoints.length - 1][0].x),
        xScale(
          dataPoints
            [dataPoints.length - 1]
            [dataPoints[dataPoints.length - 1].length - 1].x,
        ),
      ];

      var xValue = xScale.invert(mouse[0]).toFixed(2);

      if (mouse[0] > range[0] && mouse[0] < range[1]) {
        attrs.onHover(xValue);
      } else {
        attrs.onHover(false);
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
      var dt = [];
      var data = attrs.data[key];
      var len = data.xs.length;

      for (let i = 0; i < len; i++) {
        dt.push({
          x: data.xs[i],
          y: data.ys[i]
        })
      }

      return dt;
    }
  };

  d3.selection.prototype.patternify = function patternify(params) {
    var container = this;
    var selector = params.selector;
    var elementTag = params.tag;
    var data = params.data || [selector];

    // Pattern in action.
    var selection = container.selectAll('.' + selector).data(data, (d, i) => {
      if (typeof d === 'object') {
        if (d.id) {
          return d.id;
        }
      }
      return i;
    });

    selection.exit().remove();
    selection = selection.enter().append(elementTag).merge(selection);
    selection.attr('class', selector);
    return selection;
  };

  // @todo: Do not do like that.
  // Dynamic keys functions.
  // Attach variables to main function.
  Object.keys(attrs).forEach((key) => {
    main[key] = function (_) {
      if (!arguments.length) {
        return attrs[key];
      }
      attrs[key] = _;
      return main;
    };
  });

  //Set attrs as property.
  main.attrs = attrs;

  //Exposed update functions.
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
