const pdfast = require('pdfast');
const _ = require("lodash");

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
  samplesToContinuousPdf,
};
