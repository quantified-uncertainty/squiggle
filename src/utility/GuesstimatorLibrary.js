import { Guesstimator } from '@foretold/guesstimator';
import { Samples } from '@foretold/cdf';
import _ from 'lodash';

/**
 *
 * @param {number} minValue
 * @param {number} maxValue
 * @returns {string}
 */
const minMaxRatio = (minValue, maxValue) => {
  if (minValue === 0 || maxValue === 0) {
    return 'SMALL';
  }
  const ratio = maxValue / minValue;
  if (ratio < 100000) {
    return 'SMALL';
  } else if (ratio < 10000000) {
    return 'MEDIUM';
  } else {
    return 'LARGE';
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
  return minMaxRatio(minValue, maxValue);
};

const toPdf = (values, sampleCount, min, max) => {
  const samples = new Samples(values);

  const ratioSize$ = ratioSize(samples);
  const width = ratioSize$ === 'SMALL' ? 20 : 1;

  const cdf = samples.toCdf({ size: sampleCount, width, min, max });
  return {ys:cdf.ys, xs:cdf.xs};
};

let run = (text, sampleCount, inputs=[], min=false, max=false) => {
    let [_error, item] = Guesstimator.parse({ text: "=" + text });
    const { parsedInput } = item;
    const { guesstimateType } = parsedInput;

    const guesstimator = new Guesstimator({ parsedInput });
    const value = guesstimator.sample(
      sampleCount,
      inputs,
    );
    const samplerType = guesstimator.samplerType();

    const values = _.filter(value.values, _.isFinite);

    let update;
    if (values.length === 0) {
      update = {xs: [], ys: []};
    } else if (values.length === 1) {
      update = {xs: [], ys: []};
    } else {
      update = toPdf(values, sampleCount, min, max);
    }
    return update;
}

module.exports = {
  run,
};