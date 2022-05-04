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

type gamma = {
  shape: float,
  scale: float,
}

@genType
type symbolicDist = [
  | #Normal(normal)
  | #Beta(beta)
  | #Lognormal(lognormal)
  | #Uniform(uniform)
  | #Exponential(exponential)
  | #Cauchy(cauchy)
  | #Triangular(triangular)
  | #Gamma(gamma)
  | #Float(float)
]

type analyticalSimplificationResult = [
  | #AnalyticalSolution(symbolicDist)
  | #Error(Operation.Error.t)
  | #NoSolution
]
