const pdfast = require("pdfast");
const filter = require("lodash/filter");
const isFinite = require("lodash/isFinite");

const samplesToContinuousPdf = (
  samples,
  size,
  width,
  min = false,
  max = false
) => {
  let _samples = filter(samples, isFinite);
  if (isFinite(min)) {
    _samples = filter(_samples, (r) => r > min);
  }
  if (isFinite(max)) {
    _samples = filter(_samples, (r) => r < max);
  }

  // The pdf that's created from this function is not a pdf but a pmf. y values
  // being probability mass and not density.
  // This is awkward, because our code assumes later that y is a density
  let pdf = pdfast.create(_samples, { size, width });

  // To convert this to a density, we need to find the step size. This is kept
  // constant for all y values
  let stepSize = pdf[1].x - pdf[0].x;

  // We then adjust the y values to density
  return { xs: pdf.map((r) => r.x), ys: pdf.map((r) => r.y / stepSize) };
};

module.exports = {
  samplesToContinuousPdf,
};
