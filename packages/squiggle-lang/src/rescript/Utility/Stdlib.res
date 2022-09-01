module Bernoulli = {
  @module external cdf: (float, float) => float = "@stdlib/stats/base/dists/bernoulli/cdf"
  let cdf = cdf

  @module external pmf: (float, float) => float = "@stdlib/stats/base/dists/bernoulli/pmf"
  let pmf = pmf

  @module external quantile: (float, float) => float = "@stdlib/stats/base/dists/bernoulli/quantile"
  let quantile = quantile

  @module external mean: float => float = "@stdlib/stats/base/dists/bernoulli/mean"
  let mean = mean

  @module external stdev: float => float = "@stdlib/stats/base/dists/bernoulli/stdev"
  let stdev = stdev

  @module external variance: float => float = "@stdlib/stats/base/dists/bernoulli/variance"
  let variance = variance
}

module Logistic = {
  @module external cdf: (float, float, float) => float = "@stdlib/stats/base/dists/logistic/cdf"
  let cdf = cdf

  @module external pdf: (float, float, float) => float = "@stdlib/stats/base/dists/logistic/pdf"
  let pdf = pdf

  @module
  external quantile: (float, float, float) => float = "@stdlib/stats/base/dists/logistic/quantile"
  let quantile = quantile

  @module external mean: (float, float) => float = "@stdlib/stats/base/dists/logistic/mean"
  let mean = mean

  @module external stdev: (float, float) => float = "@stdlib/stats/base/dists/logistic/stdev"
  let stdev = stdev

  @module external variance: (float, float) => float = "@stdlib/stats/base/dists/logistic/variance"
  let variance = variance
}

module Random = {
  type sampleArgs = {
    probs: array<float>,
    size: int,
  }
  @module external sample: (array<float>, sampleArgs) => array<float> = "@stdlib/random/sample"
  let sample = sample
}
