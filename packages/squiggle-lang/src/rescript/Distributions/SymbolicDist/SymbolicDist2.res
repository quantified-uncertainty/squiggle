open SymbolicDistTypes

module type ValidNormal = {
  let params: normal
  let distribution: validated<symbolicDist>
}

let normalFrom90PercentCI = (low, high) => {
  let mean = E.A.Floats.mean([low, high])
  let stdev = (high -. low) /. (2.0 *. 1.644854)
  (mean, stdev)
}

module Normal = (Validated: ValidNormal) => {
  let pdf = x => Jstat.Normal.pdf(x, Validated.params.mean, Validated.params.stdev)
  let cdf = x => Jstat.Normal.cdf(x, Validated.params.mean, Validated.params.stdev)

  let from90PercentCI = (low, high) => {
      let (mean, stdev) = normalFrom90PercentCI(low, high)
      normalConstr({mean: mean, stdev: stdev})
  }

  let inv = p => Jstat.Normal.inv(p, Validated.params.mean, Validated.params.stdev)
  let sample = Jstat.Normal.sample(Validated.params.mean, Validated.params.stdev)
  let mean = Jstat.Normal.mean(Validated.params.mean, Validated.params.stdev)
  let toString = j`Normal(${Js.Float.toString(Validated.params.mean)},${Js.Float.toString(Validated.params.stdev)})`
}

module NormalBinOps = (N1: ValidNormal, N2: ValidNormal) => {
  let add = {
    let mean = N1.params.mean +. N2.params.mean
    let stdev = sqrt(N1.params.stdev ** 2.0 +. N2.params.stdev ** 2.0)
    normalConstr({mean: mean, stdev: stdev})
  }

  let subtract = {
    let mean = N1.params.mean -. N2.params.mean
    let stdev = sqrt(N1.params.stdev ** 2.0 +. N2.params.stdev ** 2.0)
    normalConstr({mean: mean, stdev: stdev})
  }

  let operate: Operation.Algebraic.t => option<validated<symbolicDist>> = operation => {
    switch operation {
        | #Add => Some(add)
        | #Subtract => Some(subtract)
        | _ => None
    }
  }
}

module type ValidLognormal = {
    let params: lognormal
    let distribution: validated<symbolicDist>
}

let lognormalFrom90PercentCI = (low, high) => {
    let logLow = log(low)
    let logHigh = log(high)
    let mu = E.A.Floats.mean([logLow, logHigh])
    let sigma = (logHigh -. logLow) /. (2.0 *. 1.645)
    (mu, sigma)
}

let lognormalFromMeanAndStdev = (mean, stdev) => {
    let variance = Js.Math.pow_float(~base=stdev, ~exp=2.0)
    let meanSquared = Js.Math.pow_float(~base=mean, ~exp=2.0)
    let mu = Js.Math.log(mean) -. 0.5 *. Js.Math.log(variance /. meanSquared +. 1.0)
    let sigma = Js.Math.pow_float(~base=Js.Math.log(variance /. meanSquared +. 1.0), ~exp=0.5)
    (mu, sigma)
} 

module Lognormal = (Validated: ValidLognormal) => {
    let pdf = x => Jstat.Lognormal.pdf(x, Validated.params.mu, Validated.params.sigma)
    let cdf = x => Jstat.Lognormal.cdf(x, Validated.params.mu, Validated.params.sigma)
    let inv = p => Jstat.Lognormal.inv(p, Validated.params.mu, Validated.params.sigma)
    let mean = Jstat.Lognormal.mean(Validated.params.mu, Validated.params.sigma)
    let sample = Jstat.Lognormal.sample(Validated.params.mu, Validated.params.sigma)
    let toString = j`Lognormal(${Js.Float.toString(Validated.params.sigma)},${Js.Float.toString(Validated.params.sigma)})`
    let from90PercentCI = (low, high) => {
        let (mu, sigma) = lognormalFrom90PercentCI(low, high)  
        lognormalConstr({mu: mu, sigma: sigma})
    }
    let fromMeanAndStdev = (mean, stdev) => {
        let (mu, sigma) = lognormalFromMeanAndStdev(mean, stdev)
        lognormalConstr({mu: mu, sigma: sigma})
    }
}

module LognormalBinOp = (LN1: ValidLognormal, LN2: ValidLognormal) => {
    let multiply = {
        let mu = LN1.params.mu +. LN2.params.mu 
        let sigma = LN1.params.sigma +. LN2.params.sigma 
        lognormalConstr({mu: mu, sigma: sigma})
    }
    let divide = {
        let mu = LN1.params.mu -. LN2.params.mu 
        let sigma = LN1.params.sigma +. LN2.params.sigma 
        lognormalConstr({mu: mu, sigma: sigma})
    }
    let operate = (operation: Operation.Algebraic.t) => {
        switch operation {
            | #Multiply => Some(multiply)
            | #Divide => Some(divide)
            | _ => None
        }
    }
}

module From90thPercentile = {
  let make: (float, float) => validated<symbolicDist> = (low, high) => {
    let (mean, stdev) = normalFrom90PercentCI(low, high)
    module NormalValueValidated: ValidNormal = {
      let params = {mean: mean, stdev: stdev}
      let distribution = normalConstr(params)
    }
    module NormalValue = Normal(NormalValueValidated)
    NormalValue.from90PercentCI(low, high)
  }
}

module T = {
  let minCdfValue = 1e-4
  let maxCdfValue = 1.0 -. 1e-4

  let pdf = (x, dist) => {
    switch dist {
      | #Normal(_params) => {
          module NormalValueValidated: ValidNormal = {
            let params = _params
            let distribution = normalConstr(params)
          }
          module NormalValue = Normal(NormalValueValidated)
          switch NormalValueValidated.distribution {
            | Ok(symbdist) => NormalValue.pdf(x)
            | Error(invalidNormal) => -1e0  // dummy value till we decide if results are gonna propagate through everything. 
          }
      }
      | #Lognormal(_params) => {
          module LognormalValueValidated: ValidLognormal = {
              let params = _params
              let distribution = lognormalConstr(params)
          }
          module LognormalValue = Lognormal(LognormalValueValidated)
          switch LognormalValueValidated.distribution {
              | Ok(symbdist) => LognormalValue.pdf(x)
              | Error(invalidLognormal) => -1e0  // dummy value till we decide how results propagate up 
          }
      }
    }
  }
}