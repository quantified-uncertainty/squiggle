const _ = require('lodash');
const d3 = require('d3');
const moment = require('moment');
require('./styles.css');

/**
 * @todo: To rename as "DistPlotD3".
 */
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
      minX: null,
      maxX: null,
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
      yMaxContinuousDomainFactor: 1,
      yMaxDiscreteDomainFactor: 1,
      options: {},
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

  /**
   * @param {string} name
   * @param value
   * @returns {CdfChartD3}
   */
  set(name, value) {
    _.set(this.attrs, [name], value);
    return this;
  }

  /**
   * @param data
   * @returns {CdfChartD3}
   */
  data(data) {
    const continuousXs = _.get(data, 'continuous.xs', []);
    const continuousYs = _.get(data, 'continuous.ys', []);
    const discreteXs = _.get(data, 'discrete.xs', []);
    const discreteYs = _.get(data, 'discrete.ys', []);
    this.attrs.data = data;
    this.attrs.data.continuous = {
      xs: continuousXs,
      ys: continuousYs,
    };
    this.attrs.data.discrete = {
      xs: discreteXs,
      ys: discreteYs,
    };
    return this;
  }

  render() {
    this._container = d3.select(this.attrs.container);
    if (this._container.node() === null) {
      throw new Error('Container for D3 is not defined.');
    }

    if (!['log', 'linear'].includes(this.attrs.scale)) {
      throw new Error('Scale should be either "log" or "linear".');
    }

    // Log Scale.
    if (this.attrs.scale === 'log') {
      this.logFilter('continuous');
      this.logFilter('discrete');
    }
    if (
      this.attrs.scale === 'log'
      && this.attrs.minX !== null
      && this.attrs.minX < 0
    ) {
      console.warn('minX should be positive.');
      this.attrs.minX = undefined;
    }

    // Fields.
    const fields = [
      'marginLeft', 'marginRight',
      'marginTop', 'marginBottom',
      'svgWidth', 'svgHeight',
      'yMaxContinuousDomainFactor',
      'yMaxDiscreteDomainFactor',
      'logBase',
    ];
    for (const field of fields) {
      if (!_.isNumber(this.attrs[field])) {
        throw new Error(`${field} should be a number.`);
      }
    }

    // Sets the width from the DOM element.
    const containerRect = this._container.node().getBoundingClientRect();
    if (containerRect.width > 0) {
      this.attrs.svgWidth = containerRect.width;
    }

    // Calculated properties.
    this.calc.chartLeftMargin = this.attrs.marginLeft;
    this.calc.chartTopMargin = this.attrs.marginTop;
    this.calc.chartWidth = this.attrs.svgWidth
      - this.attrs.marginRight
      - this.attrs.marginLeft;
    this.calc.chartHeight = this.attrs.svgHeight
      - this.attrs.marginBottom
      - this.attrs.marginTop;

    // Add svg.
    this.svg = this._container
      .createObject({ tag: 'svg', selector: 'svg-chart-container' })
      .attr('width', '100%')
      .attr('height', this.attrs.svgHeight)
      .attr('pointer-events', 'none');

    // Add container 'g' (empty) element.
    this.chart = this.svg
      .createObject({ tag: 'g', selector: 'chart' })
      .attr(
        'transform',
        `translate(${this.calc.chartLeftMargin}, ${this.calc.chartTopMargin})`,
      );

    try {
      const common = this.getCommonThings();
      if (this.hasDate('continuous')) {
        this.addDistributionChart(common);
      }
      if (this.hasDate('discrete')) {
        this.addLollipopsChart(common);
      }
    } catch (e) {
      throw e;
    }
    return this;
  }

  /**
   * @returns {*}
   */
  getCommonThings() {
    // Boundaries.
    const xMin = this.attrs.minX
      || d3.min(this.attrs.data.continuous.xs)
      || d3.min(this.attrs.data.discrete.xs);
    const xMax = this.attrs.maxX
      || d3.max(this.attrs.data.continuous.xs)
      || d3.max(this.attrs.data.discrete.xs);

    const yMin = d3.min(this.attrs.data.continuous.ys);
    const yMax = d3.max(this.attrs.data.continuous.ys);

    // Errors.
    if (!_.isFinite(xMin)) throw new Error('xMin is undefined');
    if (!_.isFinite(xMax)) throw new Error('xMax is undefined');
    if (!_.isFinite(yMin)) throw new Error('yMin is undefined');
    if (!_.isFinite(yMax)) throw new Error('yMax is undefined');

    // X-domains.
    const yMaxDomainFactor = _.get(this.attrs, 'yMaxContinuousDomainFactor', 1);
    const xMinDomain = xMin;
    const xMaxDomain = xMax;
    const yMinDomain = yMin;
    const yMaxDomain = yMax * yMaxDomainFactor;

    // X-scale.
    const xScale = this.attrs.scale === 'linear'
      ? d3.scaleLinear()
        .domain([xMinDomain, xMaxDomain])
        .range([0, this.calc.chartWidth])
      : d3.scaleLog()
        .base(this.attrs.logBase)
        .domain([xMinDomain, xMaxDomain])
        .range([0, this.calc.chartWidth]);

    // Y-scale.
    const yScale = d3.scaleLinear()
      .domain([yMinDomain, yMaxDomain])
      .range([this.calc.chartHeight, 0]);

    return {
      xMin, xMax,
      xScale, yScale,
    };
  }

  /**
   * @param common
   */
  addDistributionChart(common) {
    const areaColorRange = d3.scaleOrdinal().range(this.attrs.areaColors);
    const dataPoints = [this.getDataPoints('continuous')];

    const { xMin, xMax, xScale, yScale } = common;

    // X-axis.
    let xAxis = null;
    if (!!this.attrs.timeScale) {
      // Calculates the projection on X-axis.
      const zero = _.get(this.attrs, 'timeScale.zero', moment());
      const unit = _.get(this.attrs, 'timeScale.unit', 'years');
      const diff = Math.abs(xMax - xMin);
      const left = zero.clone().add(xMin, unit);
      const right = left.clone().add(diff, unit);

      // X-time-scale.
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
            return d3.format('.2')(d);
          } else if (xMin > 1000 && xMax < 3000) {
            // Condition which identifies years; 2019, 2020, 2021.
            return d3.format('.0')(d);
          } else {
            const prefix = d3.formatPrefix('.0', d);
            return prefix(d).replace('G', 'B');
          }
        });
    }

    // Y-axis.
    const yAxis = d3.axisRight(yScale);

    // Add axis.
    this.chart
      .createObject({ tag: 'g', selector: 'x-axis' })
      .attr('transform', `translate(0, ${this.calc.chartHeight})`)
      .call(xAxis);

    if (this.attrs.showDistributionYAxis) {
      this.chart
        .createObject({ tag: 'g', selector: 'y-axis' })
        .call(yAxis);
    }

    // Draw area.
    const area = d3.area()
      .x(d => xScale(d.x))
      .y1(d => yScale(d.y))
      .y0(this.calc.chartHeight);

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
      const line = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

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

      function mouseover() {
        const mouse = d3.mouse(this);
        hoverLine
          .attr('opacity', 1)
          .attr('x1', mouse[0])
          .attr('x2', mouse[0]);
        const xValue = xScale.invert(mouse[0]);
        context.attrs.onHover(xValue);
      }

      function mouseout() {
        hoverLine.attr('opacity', 0);
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
  }

  /**
   * @param {object} common
   * @param {object} common.xScale
   * @param {object} common.yScale
   */
  addLollipopsChart(common) {
    const data = this.getDataPoints('discrete');

    const _yMin = d3.min(this.attrs.data.discrete.ys);
    const yMax = d3.max(this.attrs.data.discrete.ys);

    // X axis.
    this.chart.append('g')
      .attr('class', 'lollipops-x-axis')
      .attr('transform', `translate(0, ${this.calc.chartHeight})`)
      .call(d3.axisBottom(common.xScale));

    // Y-domain.
    const yMaxDomainFactor = _.get(this.attrs, 'yMaxDiscreteDomainFactor', 1);
    const yMinDomain = 0;
    const yMaxDomain = yMax * yMaxDomainFactor;

    // Y-scale.
    const yScale = d3.scaleLinear()
      .domain([yMinDomain, yMaxDomain])
      .range([this.calc.chartHeight, 0]);

    const yTicks = Math.floor(this.calc.chartHeight / 20);
    const yAxis = d3.axisLeft(yScale).ticks(yTicks);

    // Adds 'g' for an y-axis.
    this.chart.append('g')
      .attr('class', 'lollipops-y-axis')
      .attr('transform', `translate(${this.calc.chartWidth}, 0)`)
      .call(yAxis);

    function showTooltip(d) {
      d3.select('#lollipops-line-' + d.id)
        .classed('lollipops-line-mouseover', true);
      d3.select('#lollipops-circle-' + d.id)
        .classed('lollipops-circle-mouseover', true)
        .attr('r', 6);
      tooltip.transition()
        .style('opacity', .9);
      tooltip.html(`x: ${d.x}, y: ${(d.y * 100).toFixed(1)}%`)
        .style('left', (common.xScale(d.x) + 60) + 'px')
        .style('top', yScale(d.y) + 'px');
    }

    function hideTooltip(d) {
      d3.select('#lollipops-line-' + d.id)
        .classed('lollipops-line-mouseover', false);
      d3.select('#lollipops-circle-' + d.id)
        .classed('lollipops-circle-mouseover', false)
        .attr('r', 4);
      tooltip.transition()
        .style('opacity', 0);
    }

    // Lines.
    this.chart.selectAll('lollipops-line')
      .data(data)
      .enter()
      .append('line')
      .attr('class', 'lollipops-line')
      .attr('id', d => 'lollipops-line-' + d.id)
      .attr('x1', d => common.xScale(d.x))
      .attr('x2', d => common.xScale(d.x))
      .attr('y1', d => yScale(d.y))
      .attr('y2', yScale(0));

    // Define the div for the tooltip
    const tooltip = this._container.append('div')
      .attr('class', 'lollipop-tooltip')
      .style('opacity', 0);

    // Circles.
    this.chart.selectAll('lollipops-circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'lollipops-circle')
      .attr('id', d => 'lollipops-circle-' + d.id)
      .attr('cx', d => common.xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', '4');

    // Rectangles.
    this.chart.selectAll('lollipops-rectangle')
      .data(data)
      .enter()
      .append('rect')
      .attr('width', 30)
      .attr('height', d => this.calc.chartHeight - yScale(d.y) + 10)
      .attr('x', d => common.xScale(d.x) - 15)
      .attr('y', d => yScale(d.y) - 10)
      .attr('opacity', 0)
      .attr('pointer-events', 'all')
      .on('mouseover', showTooltip)
      .on('mouseout', hideTooltip)
    ;
  }

  /**
   * @param ts
   * @returns {string}
   */
  formatDates(ts) {
    return moment(ts).format('MMMM Do YYYY');
  }

  /**
   * @param {string} unit
   * @returns {*}
   */
  getTimeTicksByStr(unit) {
    switch (unit) {
      case 'months':
        return d3.timeMonth.every(4);
      case 'quarters':
        // It is temporary solution, but it works
        // if the difference between edge dates is not
        // much more than 10 units.
        return d3.timeMonth.every(12);
      case 'hours':
        return d3.timeHour.every(10);
      case 'days':
        return d3.timeDay.every(7);
      case 'seconds':
        return d3.timeSecond.every(10);
      case 'years':
        return d3.timeYear.every(10);
      case 'minutes':
        return d3.timeMinute.every(10);
      case 'weeks':
        return d3.timeWeek.every(10);
      case 'milliseconds':
        return d3.timeMillisecond.every(10);
      default:
        return d3.timeYear.every(10);
    }
  }

  /**
   * @param {string} key
   * @returns {{x: number[], y: number[]}}
   */
  getDataPoints(key) {
    const dt = [];
    const emptyShape = { xs: [], ys: [] };
    const data = _.get(this.attrs.data, key, emptyShape);
    const len = data.xs.length;

    for (let i = 0; i < len; i++) {
      const x = data.xs[i];
      const y = data.ys[i];
      const id = i;
      dt.push({ x, y, id });
    }

    return dt;
  }

  /**
   * @param {string} key
   * @returns {{x: number[], y: number[]}}
   */
  logFilter(key) {
    const xs = [];
    const ys = [];
    const emptyShape = { xs: [], ys: [] };
    const data = _.get(this.attrs.data, key, emptyShape);

    for (let i = 0, len = data.xs.length; i < len; i++) {
      const x = data.xs[i];
      const y = data.ys[i];
      if (x > 0) {
        xs.push(x);
        ys.push(y);
      }
    }

    _.set(this.attrs.data, [key, 'xs'], xs);
    _.set(this.attrs.data, [key, 'ys'], ys);
  }

  /**
   * @param {string} key
   * @returns {boolean}
   */
  hasDate(key) {
    const xs = _.get(this.attrs, ['data', key, 'xs']);
    return !!_.size(xs);
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
