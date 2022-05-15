var Bernoulli = require("@stdlib/stats/base/dists/bernoulli").Bernoulli;

let bernoulliCdf = (p: number, x: number): number => new Bernoulli(p).cdf(x);
let bernoulliPmf = (p: number, x: number): number => new Bernoulli(p).cmf(x);
