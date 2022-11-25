// type normal = {
//   mean: float,
//   stdev: float,
// }

// type lognormal = {
//   mu: float,
//   sigma: float,
// }

// type uniform = {
//   low: float,
//   high: float,
// }

// type beta = {
//   alpha: float,
//   beta: float,
// }

// type exponential = {rate: float}

// type cauchy = {
//   local: float,
//   scale: float,
// }

// type triangular = {
//   low: float,
//   medium: float,
//   high: float,
// }

// type gamma = {
//   shape: float,
//   scale: float,
// }

// type logistic = {
//   location: float,
//   scale: float,
// }

// type bernoulli = {p: float}

@genType
type symbolicDist

type analyticalSimplificationResult = option<result<symbolicDist, Operation.Error.t>>
