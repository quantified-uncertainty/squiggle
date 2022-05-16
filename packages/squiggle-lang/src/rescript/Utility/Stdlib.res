module Bernoulli = {
  @module external cdf: (float, float) => float = "@stdlib/stats/base/dists/bernoulli/cdf"
  let cdf = cdf

  @module external pmf: (float, float) => float = "@stdlib/stats/base/dists/bernoulli/pmf"
  let pmf = pmf

  @module external quantile: (float, float) => float = "@stdlib/stats/base/dists/bernoulli/quantile"
  let quantile = quantile

  @module external mean: float => float = "@stdlib/stats/base/dists/bernoulli/mean"
  let mean = mean
}
