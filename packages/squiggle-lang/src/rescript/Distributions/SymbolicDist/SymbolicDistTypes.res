type normal = {
  mean: float,
  stdev: float,
}

type lognormal = {
  mu: float,
  sigma: float,
}

type uniform = {
  low: float,
  high: float,
}

type beta = {
  alpha: float,
  beta: float,
}

type exponential = {rate: float}

type cauchy = {
  local: float,
  scale: float,
}

type triangular = {
  low: float,
  medium: float,
  high: float,
}

type symbolicValidationError = 
| InvalidNormal(string)
| InvalidLognormal(string)
| InvalidUniform(string) 
| InvalidBeta(string) 
| InvalidExponential(string)
| InvalidCauchy(string)
| InvalidTriangular(string)

type validated<'a> = result<'a, symbolicValidationError>

let valiNormal: normal => validated<normal> = t => {
  if t.stdev <= 0.0 {
    Error(InvalidNormal("Stdev must be strictly greater than 0"))
  } else {
    Ok(t)
  }
}

let valiExponential: exponential => validated<exponential> = t => {
  if t.rate <= 0.0 {
    Error(InvalidExponential("Exponential distribtion rate must be larger than 0"))
  } else {
    Ok(t)
  }
}

let valiCauchy: cauchy => validated<cauchy> = t => {
  Ok(t)
}

let valiTriangular: triangular => validated<triangular> = t => {
  if t.low >= t.medium || t.medium >= t.high {
    Error(InvalidTriangular("Triangular values must be in increasing order"))
  } else {
    Ok(t)
  }
}

let valiBeta: beta => validated<beta> = t => {
  if t.alpha <= 0.0 || t.beta <= 0.0 {
    Error(InvalidBeta("Beta distribution parameters must be strictly positive"))
  } else {
    Ok(t)
  }
}

let valiLognormal: lognormal => validated<lognormal> = t => {
  if t.sigma <= 0.0 {
    Error(InvalidLognormal("Lognormal standard deviation must be strictly positive"))
  } else {
    Ok(t)
  }
}

let valiUniform: uniform => validated<uniform> = t => {
  if t.low >= t.high {
    Error(InvalidUniform("High must be strictly greater than low"))
  } else {
    Ok(t)
  }
}

let valiFloat: float => validated<float> = t => {
  Ok(t)
}

@genType
type symbolicDistR = [
  | #NormalR(validated<normal>)
  | #BetaR(validated<beta>)
  | #LognormalR(validated<lognormal>)
  | #UniformR(validated<uniform>)
  | #ExponentialR(validated<exponential>)
  | #CauchyR(validated<cauchy>)
  | #TriangularR(validated<triangular>)
  | #FloatR(validated<float>)
]

type symbolicDist = [
  | #Normal(normal)
  | #Beta(beta)
  | #Lognormal(lognormal)
  | #Uniform(uniform)
  | #Exponential(exponential)
  | #Cauchy(cauchy)
  | #Triangular(triangular)
  | #Float(float)
]

type analyticalSimplificationResult = [
  | #AnalyticalSolution(symbolicDist)
  | #Error(string)
  | #NoSolution
]

// I feel like this should be something in `E.R.`...
let f: symbolicDistR => validated<symbolicDist> = x => { 
  switch x {
    | #NormalR(vNormal) => switch vNormal {
      | Ok(t) => Ok(#Normal(t))
      | Error(t) => Error(t)
    }
    | #BetaR(vBeta) => switch vBeta {
      | Ok(t) => Ok(#Beta(t))
      | Error(t) => Error(t)
    }
    | #LognormalR(vLognormal) => switch vLognormal {
      | Ok(t) => Ok(#Lognormal(t))
      | Error(t) => Error(t)
    }
    | #UniformR(vUniform) => switch vUniform {
      | Ok(t) => Ok(#Uniform(t))
      | Error(t) => Error(t)
    }
    | #ExponentialR(vExponential) => switch vExponential {
      | Ok(t) => Ok(#Exponential(t))
      | Error(t) => Error(t)
    }
    | #CauchyR(vExponential) => switch vExponential {
      | Ok(t) => Ok(#Cauchy(t))
      | Error(t) => Error(t)
    }
    | #TriangularR(vExponential) => switch vExponential {
      | Ok(t) => Ok(#Triangular(t))
      | Error(t) => Error(t)
    }
    | #FloatR(vExponential) => switch vExponential {
      | Ok(t) => Ok(#Float(t))
      | Error(t) => Error(t)
    }
  }
}

let normalConstr: normal => validated<symbolicDist> = t => t -> valiNormal -> #NormalR -> f
let exponentialConstr: exponential => validated<symbolicDist> = t => t -> valiExponential -> #ExponentialR -> f
let cauchyConstr: cauchy => validated<symbolicDist> = t => t -> valiCauchy -> #CauchyR -> f
let triangularConstr: triangular => validated<symbolicDist> = t => t -> valiTriangular -> #TriangularR -> f
let betaConstr: beta => validated<symbolicDist> = t => t -> valiBeta -> #BetaR -> f
let lognormalConstr: lognormal => validated<symbolicDist> = t => t -> valiLognormal -> #LognormalR -> f
let uniformConstr: uniform => validated<symbolicDist> = t => t -> valiUniform -> #UniformR -> f
let floatConstr: float => validated<symbolicDist> = t => t -> valiFloat -> #FloatR -> f
