module Bernoulli = {
  @module("../../js/math") external cdf: (float, float) => float = "bernoulli_cdf"
  @module("../../js/math") external pmf: (float, float) => float = "bernoulli_pmf"
  @module("../../js/math") external quantile: (float, float) => float = "bernoulli_quantile"
  @module("../../js/math") external mean: float => float = "bernoulli_mean"
  @module("../../js/math") external stdev: float => float = "bernoulli_stdev"
  @module("../../js/math") external variance: float => float = "bernoulli_variance"
}

// @module external logistic: (float, float, float) => float = ""

module Logistic = {
  @module("../../js/math") external cdf: (float, float, float) => float = "logistic_cdf"
  @module("../../js/math") external pdf: (float, float, float) => float = "logistic_pdf"
  @module("../../js/math") external quantile: (float, float, float) => float = "logistic_quantile"
  @module("../../js/math") external mean: (float, float) => float = "logistic_mean"
  @module("../../js/math") external stdev: (float, float) => float = "logistic_stdev"
  @module("../../js/math") external variance: (float, float) => float = "logistic_variance"
}

module Random = {
  type sampleArgs = {
    probs: array<float>,
    size: int,
  }
  @module("../../js/math") external sample: (array<float>, sampleArgs) => array<float> = "random_sample"
}

module Math = {
  @module("../../js/math") external factorial: float => float = "factorial"
}
