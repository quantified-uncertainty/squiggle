type SampleArgs = {
  probs: number[];
  size: number;
};

export function randomSample(dist: number[], args: SampleArgs): number[] {
  const { probs, size } = args;
  const sum = probs.reduce((a, b) => a + b);
  
  let sample: number[] = Array(size);

  for (let index = 0; index < size; index++) {
    // Instead of normalizing the whole probability array, we just multiply random by that value.
    // Might actually be more costly at large sample sizes?
    let acc = Math.random() * sum;
    let selection = probs.findIndex((prob) => (acc -= prob) <= 0);
    // May happen due to fp shenanigans
    if (selection == -1) selection = size - 1;
    sample[index] = dist[selection];
  }
  return sample;
}

// Should be replaced by a lookup table if we ever use it too much
export function factorial(n: number): number {
  let fct = 1;
  while (n > 0) {
    fct *= n--
  }
  return fct;
}

type Distribution<P> = {
  cdf(args: P, x: number): number;
  mean(args: P): number;
  stdev(args: P): number;
  variance(args: P): number;
  quantile(args: P, p: number): number;
};

type ContinuousProbabilityDistribution<P> = Distribution<P> & {
  pdf(args: P, x: number): number;
};

type DiscreteProbabilityDistribution<P> = Distribution<P> & {
  pmf(args: P, x: number): number;
};

let bernoulli: DiscreteProbabilityDistribution<number> = {
  pmf: (p, x) => (x === 0 ? 1 - p : p),
  cdf: (p, x) => (x < 0 ? 0 : x >= 1 ? 1 : 1 - p),
  mean: (p) => p,
  stdev: (p) => Math.sqrt(p * (1 - p)),
  quantile: (p, prob) => (prob <= 1 - p ? 0 : 1),
  variance: (p) => p * (1 - p),
};

function sq(n: number): number  { return n * n }

let logistic: ContinuousProbabilityDistribution<{ mu: number; s: number }> = {
  pdf: ({ mu, s }, x) => {
    if (s === 0) return mu === x ? +Infinity : 0;
    let exp_delta = Math.exp(-((x - mu) / s));
    return exp_delta / (s * sq(1 + exp_delta));
  },
  cdf: ({ mu, s }, x) => {
    if (s === 0) return mu === x ? +Infinity : 0;
    let exp_delta = Math.exp(-((x - mu) / s));
    return 1 / (1 + exp_delta);
  },
  mean: ({ mu, s }) => mu,
  stdev: ({ mu, s }) => Math.sqrt((sq(s) * sq(Math.PI)) / 3),
  variance: ({ mu, s }) => (sq(s) * sq(Math.PI)) / 3,
  quantile: ({ mu, s }, p) => {
    if (p === 0) return (s === 0) ? mu : +Infinity
    return mu + s * Math.log(p / (1 - p))
  },
};

export let bernoulli_pmf = bernoulli.pmf;
export let bernoulli_cdf = bernoulli.cdf;
export let bernoulli_mean = bernoulli.mean;
export let bernoulli_stdev = bernoulli.stdev;
export let bernoulli_variance = bernoulli.variance;
export let bernoulli_quantile = (prob: number, p: number) =>
  bernoulli.quantile(p, prob);

export let logistic_pdf = (mu: number, s: number, x: number) =>
  logistic.pdf({ mu, s }, x);
export let logistic_cdf = (mu: number, s: number, x: number) =>
  logistic.cdf({ mu, s }, x);
export let logistic_mean = (mu: number, s: number) => logistic.mean({ mu, s });
export let logistic_stdev = (mu: number, s: number) =>
  logistic.stdev({ mu, s });
export let logistic_variance = (mu: number, s: number) =>
  logistic.variance({ mu, s });
export let logistic_quantile = (prob: number, mu: number, s: number) =>
  logistic.quantile({ mu, s }, prob);
