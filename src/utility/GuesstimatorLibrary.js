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


const toPdf = (values, outputResolutionCount, min, max) => {
  let duplicateSamples = _(values).groupBy().pickBy(x => x.length > 1).keys().value();
  let totalLength = _.size(values);
  let frequencies = duplicateSamples.map(s => ({value: parseFloat(s), percentage: _(values).filter(x => x ==s).size()/totalLength}));
  let continuousSamples = _.difference(values, frequencies.map(f => f.value));

  let discrete = {xs: frequencies.map(f => f.value), ys: frequencies.map(f => f.percentage)};
  let continuous = {ys: [], xs: []};
  if (continuousSamples.length > 1){
    const samples = new Samples(continuousSamples);

    const ratioSize$ = ratioSize(samples);
    const width = ratioSize$ === 'SMALL' ? 100 : 1;

    const pdf = samples.toPdf({ size: outputResolutionCount, width, min, max });
    continuous = pdf;
  }
  return {continuous, discrete};
};

let run = (text, sampleCount, outputResolutionCount, inputs=[], min=false, max=false) => {
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
    let blankResponse = {
      continuous: {ys: [], xs: []},
      discrete: {ys: [], xs: []}
    };
    if (values.length === 0) {
      update = blankResponse;
    } else if (values.length === 1) {
      update = blankResponse;
    } else {
      update = toPdf(values, outputResolutionCount, min, max);
    }
    return update;
}

module.exports = {
  run,
};