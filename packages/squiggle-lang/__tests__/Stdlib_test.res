open Jest
open Expect

let makeTest = (~only=false, str, item1, item2) =>
  (only ? Only.test : test)(str, () => expect(item1)->toEqual(item2))

let makeTestApproxEq = (~only=false, ~digits=5, str, item1, item2) =>
  (only ? Only.test : test)(str, () => expect(item1)->toBeSoCloseTo(~digits, item2))

describe("Stdlib.Random", () => {
  makeTest(
    "Length of Random.sample",
    Stdlib.Random.sample([1.0, 2.0], {probs: [0.5, 0.5], size: 10})->E.A.length,
    10,
  )
  makeTest(
    "Random.sample returns elements from input array (will fail with very slim probability)",
    Stdlib.Random.sample([1.0, 2.0], {probs: [0.5, 0.5], size: 10})->E.A.uniq->E.A.Floats.sort,
    [1.0, 2.0],
  )
})

describe("Stdlib.Logistic", () => {
  let mu = 0.0
  let s = 2.0
  let cdf = Stdlib.Logistic.cdf(mu, s)
  let pdf = Stdlib.Logistic.pdf(mu, s)
  let stdev = Stdlib.Logistic.stdev(mu, s)
  let variance = Stdlib.Logistic.variance(mu, s)
  // FIXME: this is ridiculous, fix the order in  the quantile function
  let quantile = p => Stdlib.Logistic.quantile(p, mu, s)
  let testRange = 10.0
  let testSteps = 1000
  let step = testRange *. 2.0 /. Belt.Int.toFloat(testSteps)
  let iter = E.A.Floats.range(-.testRange, testRange, testSteps)

  makeTest(
    "CDF only grows",
    iter->Js.Array2.map(cdf)->(arr => E.A.pairwise(arr, (a, b) => a <= b))->E.A.every(a => a),
    true,
  )

  makeTest(
    "CDF conforms to PDF",
    iter
    ->Js.Array2.map(a => (cdf(a), pdf(a)))
    ->(arr => E.A.pairwise(arr, (a, b) => (a, b)))
    ->E.A.every((((cdf, _pdf), (cdf', pdf'))) =>
      Js.Math.abs_float(cdf' -. cdf -. pdf' *. step) < 0.0001
    ),
    true,
  )

  makeTest(
    "Quantile is inverse of CDF",
    iter
    ->Js.Array2.map(p => (p, quantile(cdf(p))))
    ->E.A.every(((p, pp)) => Js.Math.abs_float(p -. pp) < 0.00001),
    true,
  )

  makeTestApproxEq("stdev == sqrt(variance)", stdev, Js.Math.sqrt(variance))
})

describe("Stdlib.Bernoulli", () => {
  let p = 0.5
  let cdf = Stdlib.Bernoulli.cdf(p)
  let pmf = Stdlib.Bernoulli.pmf(p)
  let stdev = Stdlib.Bernoulli.stdev(p)
  let variance = Stdlib.Bernoulli.variance(p)
  // FIXME: this is ridiculous, fix the order in  the quantile function
  let quantile = prob => Stdlib.Bernoulli.quantile(prob, p)
  let iter = [0.0, 1.0]
  let step = 1.0

  makeTest(
    "CDF only grows",
    iter->Js.Array2.map(cdf)->(arr => E.A.pairwise(arr, (a, b) => a <= b))->E.A.every(a => a),
    true,
  )
  makeTest(
    "CDF conforms to PMF",
    iter
    ->Js.Array2.map(a => (cdf(a), pmf(a)))
    ->(arr => E.A.pairwise(arr, (a, b) => (a, b)))
    ->E.A.every((((cdf, _pmf), (cdf', pmf'))) =>
      Js.Math.abs_float(cdf' -. cdf -. pmf' *. step) < 0.0001
    ),
    true,
  )

  makeTest(
    "Quantile is inverse of CDF",
    iter
    ->Js.Array2.map(p => (p, quantile(cdf(p))))
    ->E.A.every(((p, pp)) => Js.Math.abs_float(p -. pp) < 0.00001),
    true,
  )

  makeTestApproxEq("stdev == sqrt(variance)", stdev, Js.Math.sqrt(variance))
})
