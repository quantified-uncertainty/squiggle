open SymbolicDistTypes

let normal95confidencePoint = 1.6448536269514722
// explained in website/docs/internal/ProcessingConfidenceIntervals

module Normal = {
  type t = normal
  let make = (mean: float, stdev: float): result<symbolicDist, string> =>
    stdev > 0.0
      ? Ok(#Normal({mean: mean, stdev: stdev}))
      : Error("Standard deviation of normal distribution must be larger than 0")
  let pdf = (x, t: t) => Jstat.Normal.pdf(x, t.mean, t.stdev)
  let cdf = (x, t: t) => Jstat.Normal.cdf(x, t.mean, t.stdev)

  let from90PercentCI = (low, high) => {
    let mean = E.A.Floats.mean([low, high])
    let stdev = (high -. low) /. (2. *. normal95confidencePoint)
    #Normal({mean: mean, stdev: stdev})
  }
  let inv = (p, t: t) => Jstat.Normal.inv(p, t.mean, t.stdev)
  let sample = (t: t) => Jstat.Normal.sample(t.mean, t.stdev)
  let mean = (t: t) => Ok(Jstat.Normal.mean(t.mean, t.stdev))
  let toString = ({mean, stdev}: t) => j`Normal($mean,$stdev)`

  let add = (n1: t, n2: t) => {
    let mean = n1.mean +. n2.mean
    let stdev = Js.Math.sqrt(n1.stdev ** 2. +. n2.stdev ** 2.)
    #Normal({mean: mean, stdev: stdev})
  }
  let subtract = (n1: t, n2: t) => {
    let mean = n1.mean -. n2.mean
    let stdev = Js.Math.sqrt(n1.stdev ** 2. +. n2.stdev ** 2.)
    #Normal({mean: mean, stdev: stdev})
  }

  // TODO: is this useful here at all? would need the integral as well ...
  let pointwiseProduct = (n1: t, n2: t) => {
    let mean =
      (n1.mean *. n2.stdev ** 2. +. n2.mean *. n1.stdev ** 2.) /. (n1.stdev ** 2. +. n2.stdev ** 2.)
    let stdev = 1. /. (1. /. n1.stdev ** 2. +. 1. /. n2.stdev ** 2.)
    #Normal({mean: mean, stdev: stdev})
  }

  let operate = (operation: Operation.Algebraic.t, n1: t, n2: t) =>
    switch operation {
    | #Add => Some(add(n1, n2))
    | #Subtract => Some(subtract(n1, n2))
    | _ => None
    }
}

module Exponential = {
  type t = exponential
  let make = (rate: float): result<symbolicDist, string> =>
    rate > 0.0
      ? Ok(
          #Exponential({
            rate: rate,
          }),
        )
      : Error("Exponential distributions rate must be larger than 0.")
  let pdf = (x, t: t) => Jstat.Exponential.pdf(x, t.rate)
  let cdf = (x, t: t) => Jstat.Exponential.cdf(x, t.rate)
  let inv = (p, t: t) => Jstat.Exponential.inv(p, t.rate)
  let sample = (t: t) => Jstat.Exponential.sample(t.rate)
  let mean = (t: t) => Ok(Jstat.Exponential.mean(t.rate))
  let toString = ({rate}: t) => j`Exponential($rate)`
}

module Cauchy = {
  type t = cauchy
  let make = (local, scale): symbolicDist => #Cauchy({local: local, scale: scale})
  let pdf = (x, t: t) => Jstat.Cauchy.pdf(x, t.local, t.scale)
  let cdf = (x, t: t) => Jstat.Cauchy.cdf(x, t.local, t.scale)
  let inv = (p, t: t) => Jstat.Cauchy.inv(p, t.local, t.scale)
  let sample = (t: t) => Jstat.Cauchy.sample(t.local, t.scale)
  let mean = (_: t) => Error("Cauchy distributions may have no mean value.")
  let toString = ({local, scale}: t) => j`Cauchy($local, $scale)`
}

module Triangular = {
  type t = triangular
  let make = (low, medium, high): result<symbolicDist, string> =>
    low < medium && medium < high
      ? Ok(#Triangular({low: low, medium: medium, high: high}))
      : Error("Triangular values must be increasing order.")
  let pdf = (x, t: t) => Jstat.Triangular.pdf(x, t.low, t.high, t.medium) // not obvious in jstat docs that high comes before medium?
  let cdf = (x, t: t) => Jstat.Triangular.cdf(x, t.low, t.high, t.medium)
  let inv = (p, t: t) => Jstat.Triangular.inv(p, t.low, t.high, t.medium)
  let sample = (t: t) => Jstat.Triangular.sample(t.low, t.high, t.medium)
  let mean = (t: t) => Ok(Jstat.Triangular.mean(t.low, t.high, t.medium))
  let toString = ({low, medium, high}: t) => j`Triangular($low, $medium, $high)`
}

module Beta = {
  type t = beta
  let make = (alpha, beta) =>
    alpha > 0.0 && beta > 0.0
      ? Ok(#Beta({alpha: alpha, beta: beta}))
      : Error("Beta distribution parameters must be positive")
  let pdf = (x, t: t) => Jstat.Beta.pdf(x, t.alpha, t.beta)
  let cdf = (x, t: t) => Jstat.Beta.cdf(x, t.alpha, t.beta)
  let inv = (p, t: t) => Jstat.Beta.inv(p, t.alpha, t.beta)
  let sample = (t: t) => Jstat.Beta.sample(t.alpha, t.beta)
  let mean = (t: t) => Ok(Jstat.Beta.mean(t.alpha, t.beta))
  let toString = ({alpha, beta}: t) => j`Beta($alpha,$beta)`
}

module Lognormal = {
  type t = lognormal
  let make = (mu, sigma) =>
    sigma > 0.0
      ? Ok(#Lognormal({mu: mu, sigma: sigma}))
      : Error("Lognormal standard deviation must be larger than 0")
  let pdf = (x, t: t) => Jstat.Lognormal.pdf(x, t.mu, t.sigma)
  let cdf = (x, t: t) => Jstat.Lognormal.cdf(x, t.mu, t.sigma)
  let inv = (p, t: t) => Jstat.Lognormal.inv(p, t.mu, t.sigma)
  let mean = (t: t) => Ok(Jstat.Lognormal.mean(t.mu, t.sigma))
  let sample = (t: t) => Jstat.Lognormal.sample(t.mu, t.sigma)
  let toString = ({mu, sigma}: t) => j`Lognormal($mu,$sigma)`

  let from90PercentCI = (low, high) => {
    let logLow = Js.Math.log(low)
    let logHigh = Js.Math.log(high)
    let mu = E.A.Floats.mean([logLow, logHigh])
    let sigma = (logHigh -. logLow) /. (2.0 *. normal95confidencePoint)
    #Lognormal({mu: mu, sigma: sigma})
  }
  let fromMeanAndStdev = (mean, stdev) => {
    // https://math.stackexchange.com/questions/2501783/parameters-of-a-lognormal-distribution
    // https://wikiless.org/wiki/Log-normal_distribution?lang=en#Generation_and_parameters
    if stdev > 0.0 {
      let variance = stdev ** 2.
      let meanSquared = mean ** 2.
      let mu = 2. *. Js.Math.log(mean) -. 0.5 *. Js.Math.log(variance +. meanSquared)
      let sigma = Js.Math.sqrt(Js.Math.log(variance /. meanSquared +. 1.))
      Ok(#Lognormal({mu: mu, sigma: sigma}))
    } else {
      Error("Lognormal standard deviation must be larger than 0")
    }
  }

  let multiply = (l1, l2) => {
    // https://wikiless.org/wiki/Log-normal_distribution?lang=en#Multiplication_and_division_of_independent,_log-normal_random_variables
    let mu = l1.mu +. l2.mu
    let sigma = Js.Math.sqrt(l1.sigma ** 2. +. l2.sigma ** 2.) // m
    #Lognormal({mu: mu, sigma: sigma})
  }
  let divide = (l1, l2) => {
    let mu = l1.mu -. l2.mu
    // We believe the ratiands will have covariance zero.
    // See here https://stats.stackexchange.com/questions/21735/what-are-the-mean-and-variance-of-the-ratio-of-two-lognormal-variables for details
    let sigma = l1.sigma +. l2.sigma
    #Lognormal({mu: mu, sigma: sigma})
  }
  let operate = (operation: Operation.Algebraic.t, n1: t, n2: t) =>
    switch operation {
    | #Multiply => Some(multiply(n1, n2))
    | #Divide => Some(divide(n1, n2))
    | _ => None
    }
}

module Uniform = {
  type t = uniform
  let make = (low, high) =>
    high > low ? Ok(#Uniform({low: low, high: high})) : Error("High must be larger than low")

  let pdf = (x, t: t) => Jstat.Uniform.pdf(x, t.low, t.high)
  let cdf = (x, t: t) => Jstat.Uniform.cdf(x, t.low, t.high)
  let inv = (p, t: t) => Jstat.Uniform.inv(p, t.low, t.high)
  let sample = (t: t) => Jstat.Uniform.sample(t.low, t.high)
  let mean = (t: t) => Ok(Jstat.Uniform.mean(t.low, t.high))
  let toString = ({low, high}: t) => j`Uniform($low,$high)`
  let truncate = (low, high, t: t): t => {
    //todo: add check
    let newLow = max(E.O.default(neg_infinity, low), t.low)
    let newHigh = min(E.O.default(infinity, high), t.high)
    {low: newLow, high: newHigh}
  }
}

module Float = {
  type t = float
  let make = t => #Float(t)
  let pdf = (x, t: t) => x == t ? 1.0 : 0.0
  let cdf = (x, t: t) => x >= t ? 1.0 : 0.0
  let inv = (p, t: t) => p < t ? 0.0 : 1.0
  let mean = (t: t) => Ok(t)
  let sample = (t: t) => t
  let toString = Js.Float.toString
}

module From90thPercentile = {
  let make = (low, high) =>
    switch (low, high) {
    | (low, high) if low <= 0.0 && low < high => Ok(Normal.from90PercentCI(low, high))
    | (low, high) if low < high => Ok(Lognormal.from90PercentCI(low, high))
    | (_, _) => Error("Low value must be less than high value.")
    }
}

module T = {
  let minCdfValue = 0.0001
  let maxCdfValue = 0.9999

  let pdf = (x, dist) =>
    switch dist {
    | #Normal(n) => Normal.pdf(x, n)
    | #Triangular(n) => Triangular.pdf(x, n)
    | #Exponential(n) => Exponential.pdf(x, n)
    | #Cauchy(n) => Cauchy.pdf(x, n)
    | #Lognormal(n) => Lognormal.pdf(x, n)
    | #Uniform(n) => Uniform.pdf(x, n)
    | #Beta(n) => Beta.pdf(x, n)
    | #Float(n) => Float.pdf(x, n)
    }

  let cdf = (x, dist) =>
    switch dist {
    | #Normal(n) => Normal.cdf(x, n)
    | #Triangular(n) => Triangular.cdf(x, n)
    | #Exponential(n) => Exponential.cdf(x, n)
    | #Cauchy(n) => Cauchy.cdf(x, n)
    | #Lognormal(n) => Lognormal.cdf(x, n)
    | #Uniform(n) => Uniform.cdf(x, n)
    | #Beta(n) => Beta.cdf(x, n)
    | #Float(n) => Float.cdf(x, n)
    }

  let inv = (x, dist) =>
    switch dist {
    | #Normal(n) => Normal.inv(x, n)
    | #Triangular(n) => Triangular.inv(x, n)
    | #Exponential(n) => Exponential.inv(x, n)
    | #Cauchy(n) => Cauchy.inv(x, n)
    | #Lognormal(n) => Lognormal.inv(x, n)
    | #Uniform(n) => Uniform.inv(x, n)
    | #Beta(n) => Beta.inv(x, n)
    | #Float(n) => Float.inv(x, n)
    }

  let sample: symbolicDist => float = x =>
    switch x {
    | #Normal(n) => Normal.sample(n)
    | #Triangular(n) => Triangular.sample(n)
    | #Exponential(n) => Exponential.sample(n)
    | #Cauchy(n) => Cauchy.sample(n)
    | #Lognormal(n) => Lognormal.sample(n)
    | #Uniform(n) => Uniform.sample(n)
    | #Beta(n) => Beta.sample(n)
    | #Float(n) => Float.sample(n)
    }

  let doN = (n, fn) => {
    let items = Belt.Array.make(n, 0.0)
    for x in 0 to n - 1 {
      let _ = Belt.Array.set(items, x, fn())
    }
    items
  }

  let sampleN = (n, dist) => doN(n, () => sample(dist))

  let toString: symbolicDist => string = x =>
    switch x {
    | #Triangular(n) => Triangular.toString(n)
    | #Exponential(n) => Exponential.toString(n)
    | #Cauchy(n) => Cauchy.toString(n)
    | #Normal(n) => Normal.toString(n)
    | #Lognormal(n) => Lognormal.toString(n)
    | #Uniform(n) => Uniform.toString(n)
    | #Beta(n) => Beta.toString(n)
    | #Float(n) => Float.toString(n)
    }

  let min: symbolicDist => float = x =>
    switch x {
    | #Triangular({low}) => low
    | #Exponential(n) => Exponential.inv(minCdfValue, n)
    | #Cauchy(n) => Cauchy.inv(minCdfValue, n)
    | #Normal(n) => Normal.inv(minCdfValue, n)
    | #Lognormal(n) => Lognormal.inv(minCdfValue, n)
    | #Uniform({low}) => low
    | #Beta(n) => Beta.inv(minCdfValue, n)
    | #Float(n) => n
    }

  let max: symbolicDist => float = x =>
    switch x {
    | #Triangular(n) => n.high
    | #Exponential(n) => Exponential.inv(maxCdfValue, n)
    | #Cauchy(n) => Cauchy.inv(maxCdfValue, n)
    | #Normal(n) => Normal.inv(maxCdfValue, n)
    | #Lognormal(n) => Lognormal.inv(maxCdfValue, n)
    | #Beta(n) => Beta.inv(maxCdfValue, n)
    | #Uniform({high}) => high
    | #Float(n) => n
    }

  let mean: symbolicDist => result<float, string> = x =>
    switch x {
    | #Triangular(n) => Triangular.mean(n)
    | #Exponential(n) => Exponential.mean(n)
    | #Cauchy(n) => Cauchy.mean(n)
    | #Normal(n) => Normal.mean(n)
    | #Lognormal(n) => Lognormal.mean(n)
    | #Beta(n) => Beta.mean(n)
    | #Uniform(n) => Uniform.mean(n)
    | #Float(n) => Float.mean(n)
    }

  let operate = (distToFloatOp: Operation.distToFloatOperation, s) =>
    switch distToFloatOp {
    | #Cdf(f) => Ok(cdf(f, s))
    | #Pdf(f) => Ok(pdf(f, s))
    | #Inv(f) => Ok(inv(f, s))
    | #Sample => Ok(sample(s))
    | #Mean => mean(s)
    }

  let interpolateXs = (~xSelection: [#Linear | #ByWeight]=#Linear, dist: symbolicDist, n) =>
    switch (xSelection, dist) {
    | (#Linear, _) => E.A.Floats.range(min(dist), max(dist), n)
    | (#ByWeight, #Uniform(n)) =>
      // In `ByWeight mode, uniform distributions get special treatment because we need two x's
      // on either side for proper rendering (just left and right of the discontinuities).
      let dx = 0.00001 *. (n.high -. n.low)
      [n.low -. dx, n.low +. dx, n.high -. dx, n.high +. dx]
    | (#ByWeight, _) =>
      let ys = E.A.Floats.range(minCdfValue, maxCdfValue, n)
      ys |> E.A.fmap(y => inv(y, dist))
    }

  /* Calling e.g. "Normal.operate" returns an optional that wraps a result.
     If the optional is None, there is no valid analytic solution. If it Some, it
     can still return an error if there is a serious problem,
     like in the case of a divide by 0.
 */
  let tryAnalyticalSimplification = (
    d1: symbolicDist,
    d2: symbolicDist,
    op: Operation.algebraicOperation,
  ): analyticalSimplificationResult =>
    switch (d1, d2) {
    | (#Float(v1), #Float(v2)) =>
      switch Operation.Algebraic.applyFn(op, v1, v2) {
      | Ok(r) => #AnalyticalSolution(#Float(r))
      | Error(n) => #Error(n)
      }
    | (#Normal(v1), #Normal(v2)) =>
      Normal.operate(op, v1, v2) |> E.O.dimap(r => #AnalyticalSolution(r), () => #NoSolution)
    | (#Lognormal(v1), #Lognormal(v2)) =>
      Lognormal.operate(op, v1, v2) |> E.O.dimap(r => #AnalyticalSolution(r), () => #NoSolution)
    | _ => #NoSolution
    }

  let toPointSetDist = (
    ~xSelection=#ByWeight,
    sampleCount,
    d: symbolicDist,
  ): PointSetTypes.pointSetDist =>
    switch d {
    | #Float(v) => Discrete(Discrete.make(~integralSumCache=Some(1.0), {xs: [v], ys: [1.0]}))
    | _ =>
      let xs = interpolateXs(~xSelection, d, sampleCount)
      let ys = xs |> E.A.fmap(x => pdf(x, d))
      Continuous(Continuous.make(~integralSumCache=Some(1.0), {xs: xs, ys: ys}))
    }
}
