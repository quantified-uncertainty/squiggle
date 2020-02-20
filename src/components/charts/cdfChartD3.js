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
      showDistributionYAxis: false,
      areaColors: ['#E1E5EC', '#E1E5EC'],
      logBase: 10,
      verticalLine: 110,
      showVerticalLine: true,
      data: {
        continuous: null,
        discrete: null,
      },
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

  showDistributionYAxis(showDistributionYAxis) {
    this.attrs.showDistributionYAxis = showDistributionYAxis;
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

    if(this.hasDate('continuous')){
      const distributionChart = this.addDistributionChart();
      if(this.hasDate('discrete')) {
        this.addLollipopsChart(distributionChart);
      }
    }
    return this;
  }

  addDistributionChart() {
    const areaColorRange = d3.scaleOrdinal().range(this.attrs.areaColors);
    const dataPoints = [this.getDataPoints('continuous')];

    // Boundaries.
    const xMin = this.attrs.minX || d3.min(this.attrs.data.continuous.xs) | d3.min(this.attrs.data.discrete.xs);
    const xMax = this.attrs.maxX || d3.max(this.attrs.data.continuous.xs) | d3.max(this.attrs.data.discrete.xs);
    const yMin = d3.min(this.attrs.data.continuous.ys);
    const yMax = d3.max(this.attrs.data.continuous.ys);

    // Scales.
    let xScale = null;
    if (this.attrs.scale === 'linear') {
      xScale = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([0, this.calc.chartWidth]);
    } else {
      xScale = d3.scaleLog()
        .base(this.attrs.logBase)
        .domain([xMin, xMax])
        .range([0, this.calc.chartWidth]);
    }

    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([this.calc.chartHeight, 0]);

    // Axis generator.
    let xAxis = null;
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

      xAxis = d3.axisBottom()
        .scale(xScaleTime)
        .ticks(this.getTimeTicksByStr(unit))
        .tickFormat(this.formatDates);
    } else {
      xAxis = d3.axisBottom(xScale)
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

    const yAxis = d3.axisRight(yScale);

    // Objects.
    const line = d3.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y));

    const area = d3.area()
      .x(d => xScale(d.x))
      .y1(d => yScale(d.y))
      .y0(this.calc.chartHeight);

    // Add axis.
    this.chart.createObject({ tag: 'g', selector: 'x-axis' })
      .attr('transform', 'translate(0,' + this.calc.chartHeight + ')')
      .call(xAxis);

    if (this.attrs.showDistributionYAxis) {
      this.chart.createObject({ tag: 'g', selector: 'y-axis' })
        .call(yAxis);
    }

    // Draw area.
    this.chart
      .createObjectsWithData({
        tag: 'path',
        selector: 'area-path',
        data: dataPoints,
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
          data: dataPoints,
        })
        .attr('d', line)
        .attr('id', (d, i) => 'line-' + (i + 1))
        .attr('opacity', (d, i) => i === 0 ? 0.7 : 1)
        .attr('fill', 'none');
    }

    if (this.attrs.showVerticalLine) {
      this.chart
        .createObject({ tag: 'line', selector: 'v-line' })
        .attr('x1', xScale(this.attrs.verticalLine))
        .attr('x2', xScale(this.attrs.verticalLine))
        .attr('y1', 0)
        .attr('y2', this.calc.chartHeight)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6 6')
        .attr('stroke', 'steelblue');
    }

    const hoverLine = this.chart
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
    {
      const context = this;
      const range = [
        xScale(dataPoints[dataPoints.length - 1][0].x),
        xScale(
          dataPoints
            [dataPoints.length - 1]
            [dataPoints[dataPoints.length - 1].length - 1].x,
        ),
      ];

      function mouseover() {
        const mouse = d3.mouse(this);
        hoverLine.attr('opacity', 1).attr('x1', mouse[0]).attr('x2', mouse[0]);
        const xValue = mouse[0] > range[0] && mouse[0] < range[1]
          ? xScale.invert(mouse[0]).toFixed(2)
          : 0;
        context.attrs.onHover(xValue);
      }

      function mouseout() {
        hoverLine.attr('opacity', 0)
      }

      this.chart
        .createObject({ tag: 'rect', selector: 'mouse-rect' })
        .attr('width', this.calc.chartWidth)
        .attr('height', this.calc.chartHeight)
        .attr('fill', 'transparent')
        .attr('pointer-events', 'all')
        .on('mouseover', mouseover)
        .on('mousemove', mouseover)
        .on('mouseout', mouseout);
    }

    return { xScale, yScale };
  }

  addLollipopsChart(distributionChart) {
    const data = this.getDataPoints('discrete');
    const ys = data.map(item => item.y);
    const yMax = d3.max(ys);

    // X axis
    this.chart.append("g")
      .attr("class", 'lollipops-x-axis')
      .attr("transform", "translate(0," + this.calc.chartHeight + ")")
      .call(d3.axisBottom(distributionChart.xScale));

    // Y axis
    const yScale = d3.scaleLinear()
      .domain([0, yMax])
      .range([this.calc.chartHeight, 0]);

    this.chart.append("g")
      .attr("class", 'lollipops-y-axis')
      .attr("transform", "translate(" + this.calc.chartWidth + ",0)")
      .call(d3.axisLeft(yScale));

    // Lines
    this.chart.selectAll("lollipops-line")
      .data(data)
      .enter()
      .append("line")
      .attr("class", 'lollipops-line')
      .attr("x1", d => distributionChart.xScale(d.x))
      .attr("x2", d => distributionChart.xScale(d.x))
      .attr("y1", d => yScale(d.y))
      .attr("y2", yScale(0));

    // Circles
    this.chart.selectAll("lollipops-circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", 'lollipops-circle')
      .attr("cx", d => distributionChart.xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", "4");
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
        return d3.timeMonth.every(4);
      case "quarters":
        return d3.timeMonth.every(3);
      case "hours":
        return d3.timeHour.every(10);
      case "days":
        return d3.timeDay.every(7);
      case "seconds":
        return d3.timeSecond.every(10);
      case "years":
        return d3.timeYear.every(10);
      case "minutes":
        return d3.timeMinute.every(10);
      case "weeks":
        return d3.timeWeek.every(10);
      case "milliseconds":
        return d3.timeMillisecond.every(10);
      default:
        return d3.timeYear.every(10);
    }
  }

  /**
   * @param {name} key
   * @returns {{x: number[], y: number[]}}
   */
  getDataPoints(key) {
    const dt = [];
    const emptyShape = { xs: [], ys: [] };
    const data = _.get(this.attrs.data, key, emptyShape);
    const len = data.xs.length;

    for (let i = 0; i < len; i++) {
      dt.push({ x: data.xs[i], y: data.ys[i] });
    }

    return dt;
  }

  /**
   * @param {string} key
   * @returns {boolean}
   */
  hasDate(key) {
    const data = _.get(this.attrs.data, key);
    return !!data;
  }
}

/**
 * @docs: https://github.com/d3/d3-selection
 * @param {object} params
 * @param {string} params.selector
 * @param {string} params.tag
 * @returns {*}
 */
d3.selection.prototype.createObject = function createObject(params) {
  const selector = params.selector;
  const tag = params.tag;
  return this.insert(tag).attr('class', selector);
};

/**
 * @docs: https://github.com/d3/d3-selection
 * @param {object} params
 * @param {string} params.selector
 * @param {string} params.tag
 * @param {*[]} params.data
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
