import {
  Pdf,
  Cdf,
  ContinuousDistribution,
  ContinuousDistributionCombination,
  scoringFunctions
} from '@foretold/cdf';

function cdfToPdf({ xs, ys }) {
  let cdf = new Cdf(xs, ys);
  let pdf = cdf.toPdf();
  return { xs: pdf.xs, ys: pdf.ys };
}

function mean(vars) {
  let cdfs = vars.map(r => new Cdf(r.xs, r.ys));
  let comb = new ContinuousDistributionCombination(cdfs);
  let newCdf = comb.combineYsWithMean(10000);
  return { xs: newCdf.xs, ys: newCdf.ys };
}

function distributionScoreDistribution(vars) {
  let cdfs = vars.map(r => (new Cdf(r.xs, r.ys)));
  let newDist = scoringFunctions.distributionInputDistributionOutputDistribution({
    predictionCdf: cdfs[0],
    aggregateCdf: cdfs[1],
    resultCdf: cdfs[2],
    sampleCount: 10000
  });
  let newCdf = (new Pdf(newDist.xs, newDist.ys)).toCdf();
  return { xs: newCdf.xs, ys: newCdf.ys };
}

function distributionScoreNumber(vars) {
  let cdfs = vars.map(r => (new Cdf(r.xs, r.ys)));
  return scoringFunctions.distributionInputDistributionOutput({
    predictionCdf: cdfs[0],
    aggregateCdf: cdfs[1],
    resultCdf: cdfs[2],
    sampleCount: 10000,
  });
}

function findY(x, { xs, ys }) {
  let cdf = new Cdf(xs, ys);
  let result = cdf.findY(x);
  return result;
}

function findX(y, { xs, ys }) {
  let cdf = new Cdf(xs, ys);
  let result = cdf.findX(y);
  return result;
}

function integral({ xs, ys }) {
  let distribution = new ContinuousDistribution(xs, ys);
  return distribution.integral();
}

module.exports = {
  cdfToPdf,
  findY,
  findX,
  mean,
  distributionScoreDistribution,
  distributionScoreNumber,
  integral
};