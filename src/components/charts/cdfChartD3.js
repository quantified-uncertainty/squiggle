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
    this.calc = {
      chartLeftMargin: null,
      chartTopMargin: null,
      chartWidth: null,
      chartHeight: null,
    };

    this.chart = null;
    this.svg = null;
    this._container = null;

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

  render() {
    this._container = d3.select(this.attrs.container);
    if (this._container.node() === null) {
      console.error('Container for D3 is not defined.');
      return;
    }
    // Sets the width from the DOM element.
    const containerRect = this._container.node().getBoundingClientRect();
    if (containerRect.width > 0) {
      this.attrs.svgWidth = containerRect.width;
    }

    // Calculated properties.
    this.calc.chartLeftMargin = this.attrs.marginLeft;
    this.calc.chartTopMargin = this.attrs.marginTop;
    this.calc.chartWidth = this.attrs.svgWidth - this.attrs.marginRight - this.attrs.marginLeft;
    this.calc.chartHeight = this.attrs.svgHeight - this.attrs.marginBottom - this.attrs.marginTop;

    // Add svg.
    this.svg = this._container
      .createObject({ tag: 'svg', selector: 'svg-chart-container' })
      .attr('width', "100%")
      .attr('height', this.attrs.svgHeight)
      .attr('pointer-events', 'none');

    // Add container g element.
    this.chart = this.svg
      .createObject({ tag: 'g', selector: 'chart' })
      .attr(
        'transform',
        'translate(' + this.calc.chartLeftMargin + ',' + this.calc.chartTopMargin + ')',
      );

    // A

    const areaColorRange = d3.scaleOrdinal().range(this.attrs.areaColors);
    this.dataPoints = [this.getDataPoints('primary')];

    // Scales.
    const xMin = d3.min(this.attrs.data.primary.xs);
    const xMax = d3.max(this.attrs.data.primary.xs);

    if (this.attrs.scale === 'linear') {
      this.xScale = d3.scaleLinear()
        .domain([this.attrs.minX || xMin, this.attrs.maxX || xMax])
        .range([0, this.calc.chartWidth]);
    } else {
      this.xScale = d3.scaleLog()
        .base(this.attrs.logBase)
        .domain([this.attrs.minX, this.attrs.maxX])
        .range([0, this.calc.chartWidth]);
    }

    const yMin = d3.min(this.attrs.data.primary.ys);
    const yMax = d3.max(this.attrs.data.primary.ys);

    this.yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([this.calc.chartHeight, 0]);

    // Axis generator.
    if (!!this.attrs.timeScale) {
      const zero = _.get(this.attrs.timeScale, 'zero', moment());
      const unit = _.get(this.attrs.timeScale, 'unit', 'years');
      const diff = Math.abs(xMax - xMin);
      const left = zero.clone().add(xMin, unit);
      const right = left.clone().add(diff, unit);

      const xScaleTime = d3.scaleTime()
        .domain([left.toDate(), right.toDate()])
        .nice()
        .range([0, this.calc.chartWidth]);

      this.xAxis = d3.axisBottom()
        .scale(xScaleTime)
        .ticks(this.getTimeTicksByStr(unit))
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

    // Objects.
    const line = d3.line()
      .x(d => this.xScale(d.x))
      .y(d => this.yScale(d.y));

    const area = d3.area()
      .x(d => this.xScale(d.x))
      .y1(d => this.yScale(d.y))
      .y0(this.calc.chartHeight);

    // Add axis.
    this.chart.createObject({ tag: 'g', selector: 'xAxis' })
      .attr('transform', 'translate(0,' + this.calc.chartHeight + ')')
      .call(this.xAxis);

    // Draw area.
    this.chart
      .createObjectsWithData({
        tag: 'path',
        selector: 'area-path',
        data: this.dataPoints,
      })
      .attr('d', area)
      .attr('fill', (d, i) => areaColorRange(i))
      .attr('opacity', (d, i) => i === 0 ? 0.7 : 0.5);

    // Draw line.
    if (this.attrs.showDistributionLines) {
      this.chart
        .createObjectsWithData({
          tag: 'path',
          selector: 'line-path',
          data: this.dataPoints,
        })
        .attr('d', line)
        .attr('id', (d, i) => 'line-' + (i + 1))
        .attr('opacity', (d, i) => i === 0 ? 0.7 : 1)
        .attr('fill', 'none');
    }

    if (this.attrs.showVerticalLine) {
      this.chart
        .createObject({ tag: 'line', selector: 'v-line' })
        .attr('x1', this.xScale(this.attrs.verticalLine))
        .attr('x2', this.xScale(this.attrs.verticalLine))
        .attr('y1', 0)
        .attr('y2', this.calc.chartHeight)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6 6')
        .attr('stroke', 'steelblue');
    }

    this.hoverLine = this.chart
      .createObject({ tag: 'line', selector: 'hover-line' })
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', this.calc.chartHeight)
      .attr('opacity', 0)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6 6')
      .attr('stroke', '#22313F');

    // Add drawing rectangle.
    const thi$ = this;
    this.chart
      .createObject({ tag: 'rect', selector: 'mouse-rect' })
      .attr('width', this.calc.chartWidth)
      .attr('height', this.calc.chartHeight)
      .attr('fill', 'transparent')
      .attr('pointer-events', 'all')
      .on('mouseover', function () {
        thi$.mouseover(this);
      })
      .on('mousemove', function () {
        thi$.mouseover(this);
      })
      .on('mouseout', this.mouseout);

    // Lollipops
    {
      const data = [
        {x: 3, y: 10},
        {x: 5, y: 30},
        {x: 7.5, y: 50},
      ];
      const xs = [3, 5, 7.5];

      // X axis
      const x = d3.scaleBand()
        .range([0, this.calc.chartWidth])
        .domain(xs)
        .padding(1);

      this.chart.append("g")
        .attr("transform", "translate(0," + this.calc.chartHeight + ")")
        .call(d3.axisBottom(x))
        .selectAll("text");

      // Add Y axis
      const y = d3.scaleLinear()
        .domain([0, 50])
        .range([this.calc.chartHeight, 0]);

      this.chart.append("g")
        .attr("transform", "translate(" + this.calc.chartWidth + ",0)")
        .call(d3.axisLeft(y));

      // Lines
      this.chart.selectAll("lollipops-line")
        .data(data)
        .enter()
        .append("line")
        .attr("x1", d => x(d.x))
        .attr("x2", d => x(d.x))
        .attr("y1", d => y(d.y))
        .attr("y2", y(0))
        .attr("stroke", "red");

      // Circles
      this.chart.selectAll("lollipops-circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.x))
        .attr("cy", d => y(d.y))
        .attr("r", "4")
        .style("fill", "yellow")
        .attr("stroke", "green");
    }
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
   * @param {string} unit
   * @returns {*}
   */
  getTimeTicksByStr(unit) {
    switch (unit) {
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

  /**
   * @param key
   * @returns {[]}
   */
  getDataPoints(key) {
    const dt = [];
    const data = this.attrs.data[key];
    const len = data.xs.length;

    for (let i = 0; i < len; i++) {
      dt.push({ x: data.xs[i], y: data.ys[i] });
    }

    return dt;
  }
}

/**
 * @docs: https://github.com/d3/d3-selection
 * @param params
 * @returns {*}
 */
d3.selection.prototype.createObject = function createObject(params) {
  const selector = params.selector;
  const tag = params.tag;
  return this.insert(tag).attr('class', selector);
};

/**
 * @example:
 * This call example
 * createObjectsByData({
 *   tag: 'path',
 *   selector: 'line-path',
 *   data: this.dataPoints,
 * })
 * will create a new tag "<path class="line-path">1,2,3</path>".
 * @docs: https://github.com/d3/d3-selection
 * @param params
 * @returns {*}
 */
d3.selection.prototype.createObjectsWithData = function createObjectsWithData(params) {
  const selector = params.selector;
  const tag = params.tag;
  const data = params.data;

  return this.selectAll('.' + selector)
    .data(data)
    .enter()
    .insert(tag)
    .attr('class', selector);
};
