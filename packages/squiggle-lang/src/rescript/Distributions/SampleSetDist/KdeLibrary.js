const filter = require("lodash/filter");
const isFinite = require("lodash/isFinite");

// Convert samples to x-y pairs for a PDF
// Uses kernel density estimation (KDE) with a triangular kernel
// samples: Must be sorted!
// size:    Number of points in output, >= 4
// xWidth:  Width of the kernel in x axis units
// weight:  Probability mass for each point
const samplesToContinuousPdf = (samples, size, xWidth, weight) => {
  samples = filter(samples, isFinite); // Not sure if this is needed?
  const len = samples.length;
  if (len === 0) return { xs: [], ys: [] };

  // Sample min and range
  const smin = samples[0];
  const srange = samples[len - 1] - smin;

  // width is in units of the step size dx and has to be a whole number
  // If we set width = wantedWidth exactly then we have:
  // width * dx === width * srange / (size - 1 - 2 * width)
  //            === srange / ((size - 1) / width - 2)
  //            === srange / ((srange + 2 * xWidth) / xWidth - 2)
  //            === srange / (srange / xWidth + 2 - 2)
  //            === xWidth
  const wantedWidth = ((size - 1) * xWidth) / (srange + 2 * xWidth);
  const width = Math.max(1, Math.floor(wantedWidth));

  // To give room for all the kernels, we'll have width steps
  // on either side as padding.
  // Subtract from the size - 1 total intervals.
  const stepsInside = size - 1 - 2 * width;
  const dx = srange / stepsInside;
  xWidth = width * dx;

  // Output min and range
  // Total number of intervals is:
  // range / dx === (srange + 2 * margin) / dx
  //            === stepsInside + 2 * width
  //            === size - 1
  const min = smin - xWidth;
  const range = srange + 2 * xWidth;

  // On our discrete set of x values, each triangle is indistinguishable
  // from a sum of two triangles with peaks at the sample's two nearest
  // neighbors. Here we sum up the peak values from all samples.
  // Only the indices width + 1 + [0, size) in ysum are ever nonzero
  // The extra zeros are to avoid out-of-bounds lookups for ddy below
  const ysum = Array(size + 2 * width).fill(0);
  const dxInv = 1 / dx;
  samples.forEach((x) => {
    const off = x - min;
    const index = Math.floor(off * dxInv);
    const left = off - index * dx;
    const right = dx - left;
    ysum[width + index + 1] += right;
    ysum[width + index + 2] += left;
  });

  // Sum for each sample will be width * width * dx
  // but we want weight / dx
  const normalizer = weight / (xWidth * xWidth);

  // A triangle at i causes the KDE to
  // - start increasing (+1) at i - width,
  // - change from increasing to decreasing (-2) at i, and
  // - stop decreasing (+1) at i + width.
  // So the result is a double prefix sum.
  let dy = 0;
  let y = 0;
  const xs = Array(size)
    .fill()
    .map((_, i) => min + i * dx);
  const ys = xs.map((_, i) => {
    const ddy = ysum[i] - 2 * ysum[i + width] + ysum[i + 2 * width];
    dy += ddy;
    y += dy;
    return normalizer * y;
  });

  return { usedWidth: xWidth, xs, ys };
};

module.exports = {
  samplesToContinuousPdf,
};
