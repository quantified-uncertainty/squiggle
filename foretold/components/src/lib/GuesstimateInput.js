import React from 'react';
import _ from 'lodash';

import { Guesstimator } from '@foretold/guesstimator';
import { Samples } from '@foretold/cdf';

/**
 * @param {number} ratio
 * @return {string}
 */
const minMaxRatio = (ratio) => {
  if (ratio < 100000) {
    return "SMALL";
  } else if (ratio < 10000000) {
    return "MEDIUM";
  } else {
    return "LARGE";
  }
};

/**
 * @param samples
 * @return {string}
 */
const ratioSize = samples => {
  samples.sort();
  const minValue = samples.getPercentile(2);
  const maxValue = samples.getPercentile(98);
  return minMaxRatio(maxValue / minValue);
};

/**
 * @param {number[]} values
 * @param {number} min
 * @param {number} max
 * @return {[number[], number[], boolean]}
 */
const toCdf = (values, min, max) => {
  let _values = values;
  if (_.isFinite(min)) _values = _.filter(_values, r => r > min);
  if (_.isFinite(max)) _values = _.filter(_values, r => r < max);

  const samples = new Samples(_values);
  const ratioSize$ = ratioSize(samples);
  const width = ratioSize$ === "SMALL" ? 20 : 1;
  const cdf = samples.toCdf({ size: 1000, width, min, max });
  return [cdf.ys, cdf.xs, ratioSize$ === "LARGE"];
};

export class GuesstimateInput extends React.Component {
  /**
   * @param props
   */
  constructor(props) {
    super(props);
    this.state = { value: this.props.initialValue || "", items: [] };
    this.handleChange = this.handleChange.bind(this);
    this.textInput = React.createRef();
  }

  componentDidMount() {
    if (this.props.focusOnRender) {
      this.textInput.focus();
    }

    if (this.state.value !== ""){
      this.handleChangeValue(this.state.value);
    }
  }

  handleChangeValue(value) {
    const text = value;

    let [_error, item] = Guesstimator.parse({ text });
    let parsedInput = item.parsedInput;
    let what = new Guesstimator({ parsedInput: parsedInput });
    let foo = what.sample(this.props.sampleCount);
    let values = _.filter(foo.values, _.isFinite);

    if (!!values) {
      this.setState({ value, items: values });
    } else {
      this.setState({ value, items: [] });
    }

    if (!values || values.length === 0) {
      this.props.onUpdate([[], [], false]);
    } else if (values.length === 1) {
      this.props.onUpdate([[1], values, false]);
    } else {
      const min = this.props.min;
      const max = this.props.max;
      this.props.onUpdate(toCdf(values, min, max));
    }

    this.props.onChange(text);
  }

  handleChange(event){
    this.handleChangeValue(event.target.value);
  }

  render() {
    return <input
      type="text"
      placeholder="10 to 100"
      value={this.state.value}
      onChange={this.handleChange}
      ref={input => this.textInput = input}
    />;
  }
}