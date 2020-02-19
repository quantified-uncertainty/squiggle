const _ = require('lodash');
const d3 = require('d3');
const moment = require('moment');

export class CdfChartD3 {

  constructor() {
    this.attrs = {
      svgWidth: 400,
      svgHeight: 400,

      marginTop: 5,
      marginBottom: 5,
      marginRight: 50,
      marginLeft: 5,

      container: null,
      minX: false,
      maxX: false,
      scale: 'linear',
      timeScale: null,
      showDistributionLines: true,
      areaColors: ['#E1E5EC', '#E1E5EC'],
      logBase: 10,
      verticalLine: 110,
      showVerticalLine: true,
      data: null,
      onHover: (e) => {
      },
    };
    this.hoverLine = null;
    this.xScale = null;
    this.dataPoints = null;
    this.mouseover = this.mouseover.bind(this);
    this.mouseout = this.mouseout.bind(this);
    this.formatDates = this.formatDates.bind(this);
  }

  svgWidth(svgWidth) {
    this.attrs.svgWidth = svgWidth;
    return this;
  }

  svgHeight(height) {
    this.attrs.svgHeight = height;
    return this;
  }

  maxX(maxX) {
    this.attrs.maxX = maxX;
    return this;
  }

  minX(minX) {
    this.attrs.minX = minX;
    return this;
  }

  scale(scale) {
    this.attrs.scale = scale;
    return this;
  }

  timeScale(timeScale) {
    this.attrs.timeScale = timeScale;
    return this;
  }

  onHover(onHover) {
    this.attrs.onHover = onHover;
    return this;
  }

  marginBottom(marginBottom) {
    this.attrs.marginBottom = marginBottom;
    return this;
  }

  marginLeft(marginLeft) {
    this.attrs.marginLeft = marginLeft;
    return this;
  }

  marginRight(marginRight) {
    this.attrs.marginRight = marginRight;
    return this;
  }

  marginTop(marginTop) {
    this.attrs.marginTop = marginTop;
    return this;
  }

  showDistributionLines(showDistributionLines) {
    this.attrs.showDistributionLines = showDistributionLines;
    return this;
  }

  verticalLine(verticalLine) {
    this.attrs.verticalLine = verticalLine;
    return this;
  }

  showVerticalLine(showVerticalLine) {
    this.attrs.showVerticalLine = showVerticalLine;
    return this;
  }

  container(container) {
    this.attrs.container = container;
    return this;
  }

  data(data) {
    this.attrs.data = data;
    return this;
  }

  /**
   * @param key
   * @returns {[]}
   */
  getDatapoints(key) {
    const dt = [];
    const data = this.attrs.data[key];
    const len = data.xs.length;

    for (let i = 0; i < len; i++) {
      dt.push({ x: data.xs[i], y: data.ys[i] });
    }

    return dt;
  }

  render() {
    const attrs = this.attrs;
    const container = d3.select(attrs.container);
    if (container.node() === null) return;

    // Sets the width from the DOM element.
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

    this.dataPoints = [this.getDatapoints('primary')];

    // Scales.
    const xMin = d3.min(attrs.data.primary.xs);
    const xMax = d3.max(attrs.data.primary.xs);

    if (attrs.scale === 'linear') {
      this.xScale = d3.scaleLinear()
        .domain([attrs.minX || xMin, attrs.maxX || xMax])
        .range([0, calc.chartWidth]);
    } else {
      this.xScale = d3.scaleLog()
        .base(attrs.logBase)
        .domain([attrs.minX, attrs.maxX])
        .range([0, calc.chartWidth]);
    }

    const yMin = d3.min(attrs.data.primary.ys);
    const yMax = d3.max(attrs.data.primary.ys);

    this.yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([calc.chartHeight, 0]);

    // Axis generator.
    if (!!this.attrs.timeScale) {
      const zero = _.get(this.attrs.timeScale, 'zero', moment());
      const step = _.get(this.attrs.timeScale, 'step', 'years');
      const length = _.get(this.attrs.timeScale, 'length', moment());

      const xScaleTime = d3.scaleTime()
        .domain([zero.toDate(), length.toDate()])
        .nice()
        .range([0, calc.chartWidth]);

      this.xAxis = d3.axisBottom()
        .scale(xScaleTime)
        .ticks(this.getTimeTicksByStr(step))
        .tickFormat(this.formatDates);
    } else {
      this.xAxis = d3.axisBottom(this.xScale)
        .ticks(3)
        .tickFormat(d => {
          if (Math.abs(d) < 1) {
            return d3.format(".2")(d);
          } else if (xMin > 1000 && xMax < 3000) {
            // Condition which identifies years; 2019, 2020, 2021.
            return d3.format(".0")(d);
          } else {
            const prefix = d3.formatPrefix(".0", d);
            return prefix(d).replace("G", "B");
          }
        });
    }

    // Line generator.
    const line = d3.line()
      .x(d => this.xScale(d.x))
      .y(d => this.yScale(d.y));

    const area = d3.area()
      .x(d => this.xScale(d.x))
      .y1(d => this.yScale(d.y))
      .y0(calc.chartHeight);

    // Add svg.
    const svg = container
      .patternify({ tag: 'svg', selector: 'svg-chart-container' })
      .attr('width', "100%")
      .attr('height', attrs.svgHeight)
      .attr('pointer-events', 'none');

    // Add container g element.
    this.chart = svg
      .patternify({ tag: 'g', selector: 'chart' })
      .attr(
        'transform',
        'translate(' + calc.chartLeftMargin + ',' + calc.chartTopMargin + ')',
      );

    // Add axis.
    this.chart.patternify({ tag: 'g', selector: 'axis' })
      .attr('transform', 'translate(' + 0 + ',' + calc.chartHeight + ')')
      .call(this.xAxis);

    // Draw area.
    this.chart
      .patternify({
        tag: 'path',
        selector: 'area-path',
        data: this.dataPoints,
      })
      .attr('d', area)
      .attr('fill', (d, i) => areaColor(i))
      .attr('opacity', (d, i) => i === 0 ? 0.7 : 0.5);

    // Draw line.
    if (attrs.showDistributionLines) {
      this.chart
        .patternify({
          tag: 'path',
          selector: 'line-path',
          data: this.dataPoints,
        })
        .attr('d', line)
        .attr('id', (d, i) => 'line-' + (i + 1))
        .attr('opacity', (d, i) => i === 0 ? 0.7 : 1)
        .attr('fill', 'none');
    }

    if (attrs.showVerticalLine) {
      this.chart
        .patternify({ tag: 'line', selector: 'v-line' })
        .attr('x1', this.xScale(attrs.verticalLine))
        .attr('x2', this.xScale(attrs.verticalLine))
        .attr('y1', 0)
        .attr('y2', calc.chartHeight)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6 6')
        .attr('stroke', 'steelblue');
    }

    this.hoverLine = this.chart
      .patternify({ tag: 'line', selector: 'hover-line' })
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', calc.chartHeight)
      .attr('opacity', 0)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6 6')
      .attr('stroke', '#22313F');

    // Add drawing rectangle.
    const thi$ = this;
    this.chart
      .patternify({ tag: 'rect', selector: 'mouse-rect' })
      .attr('width', calc.chartWidth)
      .attr('height', calc.chartHeight)
      .attr('fill', 'transparent')
      .attr('pointer-events', 'all')
      .on('mouseover', function () {
        thi$.mouseover(this);
      })
      .on('mousemove', function () {
        thi$.mouseover(this);
      })
      .on('mouseout', this.mouseout);

    return this;
  }

  mouseover(constructor) {
    const mouse = d3.mouse(constructor);
    this.hoverLine.attr('opacity', 1)
      .attr('x1', mouse[0])
      .attr('x2', mouse[0]);

    const xValue = this.xScale.invert(mouse[0]).toFixed(2);

    const range = [
      this.xScale(this.dataPoints[this.dataPoints.length - 1][0].x),
      this.xScale(
        this.dataPoints
          [this.dataPoints.length - 1]
          [this.dataPoints[this.dataPoints.length - 1].length - 1].x,
      ),
    ];

    if (mouse[0] > range[0] && mouse[0] < range[1]) {
      this.attrs.onHover(xValue);
    } else {
      this.attrs.onHover(0.0);
    }
  }

  mouseout() {
    this.hoverLine.attr('opacity', 0)
  }

  formatDates(ts) {
    return moment(ts).format("MMMM Do YYYY");
  }

  /**
   * @param {string} step
   * @returns {*}
   */
  getTimeTicksByStr(step) {
    switch (step) {
      case "months":
        return d3.timeMonth.every(1);
      case "quarters":
        return d3.timeMonth.every(3);
      case "hours":
        return d3.timeHour.every(1);
      case "days":
        return d3.timeDay.every(1);
      case "seconds":
        return d3.timeSecond.every(1);
      case "years":
        return d3.timeYear.every(1);
      case "minutes":
        return d3.timeMinute.every(1);
      case "weeks":
        return d3.timeWeek.every(1);
      case "milliseconds":
        return d3.timeMillisecond.every(1);
      default:
        return d3.timeYear.every(1);
    }
  }
}

d3.selection.prototype.patternify = function patternify(params) {
  const selector = params.selector;
  const elementTag = params.tag;
  const data = params.data || [selector];

  const selection = this.selectAll('.' + selector)
    .data(data, (d, i) => {
      if (typeof d === 'object' && d.id) return d.id;
      return i;
    });

  selection.exit().remove();

  return selection
    .enter()
    .append(elementTag)
    .merge(selection)
    .attr('class', selector);
};
