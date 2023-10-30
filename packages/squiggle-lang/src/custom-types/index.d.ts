declare module "jstat" {
  export namespace normal {
    export function pdf(x: number, mu: number, sigma: number): number;
    export function cdf(x: number, mu: number, sigma: number): number;
    export function inv(x: number, mu: number, sigma: number): number;
    export function sample(mu: number, sigma: number): number;
    export function mean(mu: number, sigma: number): number;
  }

  export namespace lognormal {
    export function pdf(x: number, mu: number, sigma: number): number;
    export function cdf(x: number, mu: number, sigma: number): number;
    export function inv(x: number, mu: number, sigma: number): number;
    export function sample(mu: number, sigma: number): number;
    export function mean(mu: number, sigma: number): number;
  }

  export namespace exponential {
    export function pdf(x: number, rate: number): number;
    export function cdf(x: number, rate: number): number;
    export function inv(x: number, rate: number): number;
    export function sample(rate: number): number;
    export function mean(rate: number): number;
    export function variance(rate: number): number;
  }

  export namespace triangular {
    export function pdf(
      x: number,
      low: number,
      high: number,
      medium: number
    ): number;
    export function cdf(
      x: number,
      low: number,
      high: number,
      medium: number
    ): number;
    export function inv(
      x: number,
      low: number,
      high: number,
      medium: number
    ): number;
    export function sample(low: number, high: number, medium: number): number;
    export function mean(low: number, high: number, medium: number): number;
    export function variance(low: number, high: number, medium: number): number;
  }

  export namespace beta {
    export function pdf(x: number, alpha: number, beta: number): number;
    export function cdf(x: number, alpha: number, beta: number): number;
    export function inv(x: number, alpha: number, beta: number): number;
    export function sample(alpha: number, beta: number): number;
    export function mean(alpha: number, beta: number): number;
    export function variance(alpha: number, beta: number): number;
  }

  export namespace uniform {
    export function pdf(x: number, low: number, high: number): number;
    export function cdf(x: number, low: number, high: number): number;
    export function inv(x: number, low: number, high: number): number;
    export function sample(low: number, high: number): number;
    export function mean(low: number, high: number): number;
  }

  export namespace cauchy {
    export function pdf(x: number, local: number, scale: number): number;
    export function cdf(x: number, local: number, scale: number): number;
    export function inv(x: number, local: number, scale: number): number;
    export function sample(local: number, scale: number): number;
  }

  export namespace gamma {
    export function pdf(x: number, shape: number, scale: number): number;
    export function cdf(x: number, shape: number, scale: number): number;
    export function inv(x: number, shape: number, scale: number): number;
    export function sample(shape: number, scale: number): number;
    export function mean(shape: number, scale: number): number;
  }

  export function factorial(x: number): number;

  export namespace binomial {
    export function pdf(k: number, n: number, p: number): number;
    export function cdf(k: number, n: number, p: number): number;
  }

  export namespace poisson {
    export function pdf(k: number, l: number): number;
    export function cdf(x: number, l: number): number;
    export function sample(l: number): number;
  }
}
