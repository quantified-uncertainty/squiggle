const {
  Samples,
} = require("@foretold/cdf/lib/samples");
const _ = require("lodash");
const { Guesstimator } = require('@foretold/guesstimator/src');
const pdfast = require('pdfast');

/**
 * @param values
 * @param outputResolutionCount
 * @param min
 * @param max
 * @returns {{discrete: {ys: *, xs: *}, continuous: {ys: [], xs: []}}}
 */
const toPdf = (values, outputResolutionCount, width, min, max) => {
  let duplicateSamples = _(values).groupBy().pickBy(x => x.length > 1).keys().value();
  let totalLength = _.size(values);
  let frequencies = duplicateSamples.map(s => ({
    value: parseFloat(s),
    percentage: _(values).filter(x => x == s).size() / totalLength
  }));
  let continuousSamples = _.difference(values, frequencies.map(f => f.value));

  let discrete = {
    xs: frequencies.map(f => f.value),
    ys: frequencies.map(f => f.percentage)
  };
  let continuous = { ys: [], xs: [] };

  if (continuousSamples.length > 20) {
    // let c = continuousSamples.map( r => (Math.log2(r)) * 1000);
    let c = continuousSamples;
    const samples = new Samples(c);

    
    const pdf = samples.toPdf({ size: outputResolutionCount, width, min, max });
    // continuous = {xs: pdf.xs.map(r => Math.pow(2,r/1000)), ys: pdf.ys};
    continuous = pdf;
  }

  return { continuous, discrete };
};

/**
 * @param text
 * @param sampleCount
 * @param outputResolutionCount
 * @param inputs
 * @param min
 * @param max
 * @returns {{discrete: {ys: *, xs: *}, continuous: {ys: *[], xs: *[]}}}
 */
const run = (
  text,
  sampleCount,
  outputResolutionCount,
  width,
  inputs = [],
  min = false,
  max = false,
) => {
  const [_error, item] = Guesstimator.parse({ text: "=" + text });
  const { parsedInput } = item;

  const guesstimator = new Guesstimator({ parsedInput });
  const value = guesstimator.sample(
    sampleCount,
    inputs,
  );

  const values = _.filter(value.values, _.isFinite);

  let update;
  let blankResponse = {
    continuous: { ys: [], xs: [] },
    discrete: { ys: [], xs: [] }
  };
  if (values.length === 0) {
    update = blankResponse;
  } else if (values.length === 1) {
    update = blankResponse;
  } else {
    update = toPdf(values, outputResolutionCount, width, min, max);
  }
  return update;
};

const stringToSamples = (
  text,
  sampleCount,
  inputs = [],
) => {
  const [_error, { parsedInput, parsedError }] = Guesstimator.parse({ text:"=" + text });

  const guesstimator = new Guesstimator({ parsedInput });
  const {values, errors} = guesstimator.sample(
    sampleCount,
    inputs,
  );
  if (errors.length > 0){
    return []
  } else {
    return values
  }
};


const samplesToContinuousPdf = (
  samples,
  size,
  width,
  min = false,
  max = false,
) => {
  let _samples = _.filter(samples, _.isFinite);
  if (_.isFinite(min)) { _samples = _.filter(_samples, r => r > min) };
  if (_.isFinite(max)) { _samples = _.filter(_samples, r => r < max) };
  let pdf = pdfast.create(_samples, { size, width });
  return {xs: pdf.map(r => r.x), ys: pdf.map(r => r.y)};
};

module.exports = {
  run,
  stringToSamples,
  samplesToContinuousPdf
};
