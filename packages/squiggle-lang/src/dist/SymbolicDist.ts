import { BaseDist } from "./BaseDist.js";
import * as Result from "../utility/result.js";
import sum from "lodash/sum.js";
import jstat from "jstat";
import * as E_A_Floats from "../utility/E_A_Floats.js";
import * as XYShape from "../XYShape.js";
import * as magicNumbers from "../magicNumbers.js";
import * as Operation from "../operation.js";
import { PointSetDist } from "./PointSetDist.js";
import { Ok, result } from "../utility/result.js";
import { ContinuousShape } from "../PointSet/Continuous.js";
import { DistError, notYetImplemented, xyShapeDistError } from "./DistError.js";
import { OperationError } from "../operationError.js";
import { DiscreteShape } from "../PointSet/Discrete.js";
import { Env } from "./env.js";

const square = (n: number): number => {
  return n * n;
};

type PointsetXSelection = "Linear" | "ByWeight";

export abstract class SymbolicDist extends BaseDist {
  private static minCdfValue = 0.0001;
  private static maxCdfValue = 0.9999;

  // all symbolic dists must override this
  abstract override toString(): string;

  // FIXME - copy-pasted from SampleSetDist
  toSparkline(bucketCount: number, env: Env): Result.result<string, DistError> {
    return Result.bind(
      this.toPointSetDist(
        {
          // In this process we want the xyPointLength to be a bit longer than the eventual toSparkline downsampling. 3 is fairly arbitrarily.
          xyPointLength: bucketCount * 3,
          sampleCount: env.sampleCount,
        },
        "Linear" // this makes this method slightly different from SampleSetDist version
      ),
      (r) => r.toSparkline(bucketCount)
    );
  }

  // symbolic dists are always normalized
  normalize() {
    return this;
  }
  integralSum() {
    return 1;
  }

  // without result wrapper, guaranteed to work on symbolic dists
  protected abstract simplePdf(f: number): number;

  pdf(f: number): Result.result<number, DistError> {
    return Ok(this.simplePdf(f));
  }

  protected interpolateXs(opts: {
    xSelection: PointsetXSelection;
    points: number;
    env: Env;
  }): number[] {
    const { xSelection, points } = opts;
    // note: this method is customized in Uniform
    switch (xSelection) {
      case "Linear":
        return E_A_Floats.range(this.min(), this.max(), points);
      case "ByWeight": {
        const ys = E_A_Floats.range(
          SymbolicDist.minCdfValue,
          SymbolicDist.maxCdfValue,
          points
        );
        return ys.map((y) => this.inv(y));
      }
      default:
        throw new Error(`Unknown xSelection value ${xSelection}`);
    }
  }

  toPointSetDist(
    env: Env,
    xSelection: PointsetXSelection = "ByWeight"
  ): result<PointSetDist, DistError> {
    const xs = this.interpolateXs({
      xSelection,
      points: env.xyPointLength,
      env,
    });
    const ys = xs.map((x) => this.simplePdf(x));
    const xyShapeR = XYShape.T.make(xs, ys);
    if (!xyShapeR.ok) {
      return Result.Err(xyShapeDistError(xyShapeR.value));
    }

    return Ok(
      new PointSetDist(
        new ContinuousShape({
          integralSumCache: 1.0, // this is a lie; real integral sum is not exactly 1 because of linear interpolation.
          xyShape: xyShapeR.value,
        }).toMixed()
      )
    );
  }

  truncate(
    left: number | undefined,
    right: number | undefined,
    opts?: { env: Env }
  ): result<BaseDist, DistError> {
    if (!opts) {
      throw new Error("env is necessary for truncating a symbolic dist");
    }
    if (left === undefined && right === undefined) {
      return Result.Ok(this);
    }

    const pointSetDistR = this.toPointSetDist(opts.env);
    if (!pointSetDistR.ok) {
      return pointSetDistR;
    }
    return pointSetDistR.value.truncate(left, right);
  }

  min() {
    return this.inv(SymbolicDist.minCdfValue);
  }

  max() {
    return this.inv(SymbolicDist.maxCdfValue);
  }

  sampleN(n: number) {
    const result: number[] = new Array(n);
    for (let i = 0; i < n; i++) {
      result[i] = this.sample();
    }
    return result;
  }

  override expectedConvolutionCost(): number {
    return magicNumbers.OpCost.symbolicCost;
  }

  isFloat(): boolean {
    return false;
  }
}

export class Normal extends SymbolicDist {
  private _mean: number;
  private _stdev: number;

  private constructor({ mean, stdev }: { mean: number; stdev: number }) {
    super();
    this._mean = mean;
    this._stdev = stdev;
  }

  static make({
    mean,
    stdev,
  }: {
    mean: number;
    stdev: number;
  }): result<Normal, string> {
    if (stdev <= 0) {
      return Result.Err(
        "Standard deviation of normal distribution must be larger than 0"
      );
    }
    return Ok(new Normal({ mean, stdev }));
  }

  toString() {
    return `Normal(${this._mean},${this._stdev})`;
  }

  simplePdf(x: number) {
    return jstat.normal.pdf(x, this._mean, this._stdev);
  }

  cdf(x: number) {
    return jstat.normal.cdf(x, this._mean, this._stdev);
  }

  inv(x: number) {
    return jstat.normal.inv(x, this._mean, this._stdev);
  }

  sample() {
    return jstat.normal.sample(this._mean, this._stdev);
  }

  mean() {
    return jstat.normal.mean(this._mean, this._stdev);
  }

  override stdev(): Result.result<number, DistError> {
    return Ok(this._stdev);
  }
  variance(): Result.result<number, DistError> {
    return Ok(this._stdev ** 2);
  }

  _isEqual(other: Normal) {
    return this._mean === other._mean && this._stdev === other._stdev;
  }

  static fromCredibleInterval({
    low,
    high,
    probability,
  }: {
    low: number;
    high: number;
    probability: number;
  }): result<Normal, string> {
    if (low >= high) {
      return Result.Err("Low value must be less than high value");
    }
    if (probability <= 0 || probability >= 1) {
      return Result.Err("Probability must be in (0, 1) interval");
    }

    // explained in website/docs/internal/ProcessingConfidenceIntervals
    const normalizedSigmas = jstat.normal.inv(1 - (1 - probability) / 2, 0, 1);
    const mean = (low + high) / 2;
    const stdev = (high - low) / (2 * normalizedSigmas);
    return Normal.make({ mean, stdev });
  }

  static add(n1: Normal, n2: Normal) {
    const mean = n1._mean + n2._mean;
    const stdev = Math.sqrt(n1._stdev ** 2 + n2._stdev ** 2);
    return new Normal({ mean, stdev });
  }
  static subtract(n1: Normal, n2: Normal) {
    const mean = n1._mean - n2._mean;
    const stdev = Math.sqrt(n1._stdev ** 2 + n2._stdev ** 2);
    return new Normal({ mean, stdev });
  }

  // // TODO: is this useful here at all? would need the integral as well ...
  // let pointwiseProduct = (n1: t, n2: t) => {
  //   let mean =
  //     (n1.mean *. n2.stdev ** 2. +. n2.mean *. n1.stdev ** 2.) /. (n1.stdev ** 2. +. n2.stdev ** 2.)
  //   let stdev = 1. /. (1. /. n1.stdev ** 2. +. 1. /. n2.stdev ** 2.)
  //   #Normal({mean, stdev})
  // }

  static operate(
    operation: Operation.AlgebraicOperation,
    n1: Normal,
    n2: Normal
  ): Normal | undefined {
    if (operation === "Add") {
      return Normal.add(n1, n2);
    } else if (operation === "Subtract") {
      return Normal.subtract(n1, n2);
    }
    return undefined;
  }

  static operateFloatFirst(
    operation: Operation.AlgebraicOperation,
    n1: number,
    n2: Normal
  ): SymbolicDist | undefined {
    if (operation === "Add") {
      return new Normal({ mean: n1 + n2._mean, stdev: n2._stdev });
    } else if (operation === "Subtract") {
      return new Normal({ mean: n1 - n2._mean, stdev: n2._stdev });
    } else if (operation === "Multiply") {
      if (n1 === 0) {
        return new PointMass(0);
      }
      return new Normal({
        mean: n1 * n2._mean,
        stdev: Math.abs(n1) * n2._stdev,
      });
    }
    return undefined;
  }

  static operateFloatSecond(
    operation: Operation.AlgebraicOperation,
    n1: Normal,
    n2: number
  ): SymbolicDist | undefined {
    if (operation === "Add") {
      return new Normal({ mean: n1._mean + n2, stdev: n1._stdev });
    } else if (operation === "Subtract") {
      return new Normal({ mean: n1._mean - n2, stdev: n1._stdev });
    } else if (operation === "Multiply") {
      if (n2 === 0) {
        return new PointMass(0);
      }
      return new Normal({
        mean: n1._mean * n2,
        stdev: n1._stdev * Math.abs(n2),
      });
    } else if (operation === "Divide") {
      return new Normal({
        mean: n1._mean / n2,
        stdev: n1._stdev / Math.abs(n2),
      });
    }
    return undefined;
  }
}

export class Exponential extends SymbolicDist {
  rate: number;
  private constructor(rate: number) {
    super();
    this.rate = rate;
  }

  static make(rate: number): result<Exponential, string> {
    if (rate <= 0) {
      return Result.Err(
        "Exponential distributions rate must be larger than 0."
      );
    }
    return Ok(new Exponential(rate));
  }

  toString() {
    return `Exponential(${this.rate})`;
  }

  simplePdf(x: number) {
    return jstat.exponential.pdf(x, this.rate);
  }
  cdf(x: number) {
    return jstat.exponential.cdf(x, this.rate);
  }
  inv(p: number) {
    return jstat.exponential.inv(p, this.rate);
  }
  sample() {
    return jstat.exponential.sample(this.rate);
  }
  mean() {
    return jstat.exponential.mean(this.rate);
  }
  variance(): result<number, DistError> {
    return Ok(jstat.exponential.variance(this.rate));
  }
  _isEqual(other: Exponential) {
    return this.rate === other.rate;
  }
}

export class Cauchy extends SymbolicDist {
  local: number;
  scale: number;
  private constructor({ local, scale }: { local: number; scale: number }) {
    super();
    this.local = local;
    this.scale = scale;
  }

  static make({
    local,
    scale,
  }: {
    local: number;
    scale: number;
  }): result<Cauchy, string> {
    if (scale > 0) {
      return Ok(new Cauchy({ local, scale }));
    } else {
      return Result.Err(
        "Cauchy distribution scale parameter must larger than 0."
      );
    }
  }

  toString() {
    return `Cauchy(${this.local}, ${this.scale})`;
  }

  simplePdf(x: number) {
    return jstat.cauchy.pdf(x, this.local, this.scale);
  }
  cdf(x: number) {
    return jstat.cauchy.cdf(x, this.local, this.scale);
  }
  inv(p: number) {
    return jstat.cauchy.inv(p, this.local, this.scale);
  }
  sample() {
    return jstat.cauchy.sample(this.local, this.scale);
  }
  mean() {
    return NaN; // Cauchy distributions may have no mean value.
  }
  override stdev(): result<number, DistError> {
    return Ok(NaN);
  }
  variance(): result<number, DistError> {
    return Ok(NaN);
  }
  _isEqual(other: Cauchy) {
    return this.local === other.local && this.scale === other.scale;
  }
}

export class Triangular extends SymbolicDist {
  low: number;
  medium: number;
  high: number;

  private constructor({
    low,
    medium,
    high,
  }: {
    low: number;
    medium: number;
    high: number;
  }) {
    super();
    this.low = low;
    this.medium = medium;
    this.high = high;
  }

  static make({
    low,
    medium,
    high,
  }: {
    low: number;
    medium: number;
    high: number;
  }): result<Triangular, string> {
    if (low < medium && medium < high) {
      return Ok(new Triangular({ low, medium, high }));
    }
    return Result.Err("Triangular values must be increasing order.");
  }

  toString() {
    return `Triangular(${this.low}, ${this.medium}, ${this.high})`;
  }

  simplePdf(x: number) {
    return jstat.triangular.pdf(x, this.low, this.high, this.medium);
  }
  cdf(x: number) {
    return jstat.triangular.cdf(x, this.low, this.high, this.medium);
  }
  inv(p: number) {
    return jstat.triangular.inv(p, this.low, this.high, this.medium);
  }
  sample() {
    return jstat.triangular.sample(this.low, this.high, this.medium);
  }
  mean() {
    return jstat.triangular.mean(this.low, this.high, this.medium);
  }
  variance(): result<number, DistError> {
    return Ok(jstat.triangular.variance(this.low, this.high, this.medium));
  }
  _isEqual(other: Triangular) {
    return (
      this.low === other.low &&
      this.medium === other.medium &&
      this.high === other.high
    );
  }

  override min() {
    return this.low;
  }
  override max() {
    return this.high;
  }
}

export class Beta extends SymbolicDist {
  alpha: number;
  beta: number;
  private constructor({ alpha, beta }: { alpha: number; beta: number }) {
    super();
    this.alpha = alpha;
    this.beta = beta;
  }

  static make({
    alpha,
    beta,
  }: {
    alpha: number;
    beta: number;
  }): result<Beta, string> {
    if (alpha > 0 && beta > 0) {
      return Ok(new Beta({ alpha, beta }));
    } else {
      return Result.Err("Beta distribution parameters must be positive");
    }
  }

  toString() {
    return `Beta(${this.alpha},${this.beta})`;
  }

  simplePdf(x: number) {
    return jstat.beta.pdf(x, this.alpha, this.beta);
  }

  cdf(x: number) {
    return jstat.beta.cdf(x, this.alpha, this.beta);
  }

  inv(x: number) {
    return jstat.beta.inv(x, this.alpha, this.beta);
  }

  sample() {
    return jstat.beta.sample(this.alpha, this.beta);
  }

  mean() {
    return jstat.beta.mean(this.alpha, this.beta);
  }

  variance(): result<number, DistError> {
    return Ok(jstat.beta.variance(this.alpha, this.beta));
  }

  _isEqual(other: Beta) {
    return this.alpha === other.alpha && this.beta === other.beta;
  }

  static fromMeanAndSampleSize({
    mean,
    sampleSize,
  }: {
    mean: number;
    sampleSize: number;
  }): result<Beta, string> {
    // https://en.wikipedia.org/wiki/Beta_distribution#Mean_and_sample_size
    const alpha = mean * sampleSize;
    const beta = (1 - mean) * sampleSize;
    return Beta.make({ alpha, beta });
  }

  static fromMeanAndStdev({
    mean,
    stdev,
  }: {
    mean: number;
    stdev: number;
  }): result<Beta, string> {
    // https://en.wikipedia.org/wiki/Beta_distribution#Mean_and_variance
    if (!(0 < stdev && stdev <= 0.5)) {
      return Result.Err("Stdev must be in in between 0 and 0.5.");
    } else if (!(0 <= mean && mean <= 1)) {
      return Result.Err("Mean must be in between 0 and 1.0.");
    } else {
      const variance = stdev * stdev;
      const sampleSize = (mean * (1 - mean)) / variance - 1;
      return Beta.fromMeanAndSampleSize({ mean, sampleSize });
    }
  }
}

export class Lognormal extends SymbolicDist {
  mu: number;
  sigma: number;

  private constructor({ mu, sigma }: { mu: number; sigma: number }) {
    super();
    this.mu = mu;
    this.sigma = sigma;
  }

  static make({
    mu,
    sigma,
  }: {
    mu: number;
    sigma: number;
  }): result<Lognormal, string> {
    if (sigma <= 0) {
      return Result.Err("Lognormal standard deviation must be larger than 0");
    }
    return Ok(new Lognormal({ mu, sigma }));
  }

  toString() {
    return `Lognormal(${this.mu},${this.sigma})`;
  }

  simplePdf(x: number) {
    return jstat.lognormal.pdf(x, this.mu, this.sigma);
  }
  cdf(x: number) {
    return jstat.lognormal.cdf(x, this.mu, this.sigma);
  }
  inv(x: number) {
    return jstat.lognormal.inv(x, this.mu, this.sigma);
  }
  sample() {
    return jstat.lognormal.sample(this.mu, this.sigma);
  }
  mean() {
    return jstat.lognormal.mean(this.mu, this.sigma);
  }
  variance(): Result.result<number, DistError> {
    return Ok(
      (Math.exp(this.sigma * this.sigma) - 1) *
        Math.exp(2 * this.mu + this.sigma * this.sigma)
    );
  }
  _isEqual(other: Lognormal) {
    return this.mu === other.mu && this.sigma === other.sigma;
  }

  static fromCredibleInterval({
    low,
    high,
    probability,
  }: {
    low: number;
    high: number;
    probability: number;
  }): result<Lognormal, string> {
    if (low >= high) {
      return Result.Err("Low value must be less than high value");
    }
    if (low <= 0) {
      return Result.Err("Low value must be above 0");
    }
    if (probability <= 0 || probability >= 1) {
      return Result.Err("Probability must be in (0, 1) interval");
    }

    const logLow = Math.log(low);
    const logHigh = Math.log(high);

    const normalizedSigmas = jstat.normal.inv(1 - (1 - probability) / 2, 0, 1);
    const mu = (logLow + logHigh) / 2;
    const sigma = (logHigh - logLow) / (2 * normalizedSigmas);
    return Lognormal.make({ mu, sigma });
  }

  static fromMeanAndStdev({
    mean,
    stdev,
  }: {
    mean: number;
    stdev: number;
  }): result<Lognormal, string> {
    // https://math.stackexchange.com/questions/2501783/parameters-of-a-lognormal-distribution
    // https://wikiless.org/wiki/Log-normal_distribution?lang=en#Generation_and_parameters
    if (mean <= 0) {
      return Result.Err("Lognormal mean must be larger than 0");
    } else if (stdev <= 0) {
      return Result.Err("Lognormal standard deviation must be larger than 0");
    } else {
      const variance = stdev ** 2;
      const meanSquared = mean ** 2;
      const mu = 2 * Math.log(mean) - 0.5 * Math.log(variance + meanSquared);
      const sigma = Math.sqrt(Math.log(variance / meanSquared + 1));
      return Ok(new Lognormal({ mu, sigma }));
    }
  }

  static multiply(l1: Lognormal, l2: Lognormal) {
    // https://wikiless.org/wiki/Log-normal_distribution?lang=en#Multiplication_and_division_of_independent,_log-normal_random_variables
    const mu = l1.mu + l2.mu;
    const sigma = Math.sqrt(l1.sigma ** 2 + l2.sigma ** 2);
    return new Lognormal({ mu, sigma });
  }
  static divide(l1: Lognormal, l2: Lognormal) {
    const mu = l1.mu - l2.mu;
    // We believe the ratiands will have covariance zero.
    // See here https://stats.stackexchange.com/questions/21735/what-are-the-mean-and-variance-of-the-ratio-of-two-lognormal-variables for details
    const sigma = Math.sqrt(l1.sigma ** 2 + l2.sigma ** 2);
    return new Lognormal({ mu, sigma });
  }

  static operate(
    operation: Operation.AlgebraicOperation,
    n1: Lognormal,
    n2: Lognormal
  ): Lognormal | undefined {
    if (operation === "Multiply") {
      return Lognormal.multiply(n1, n2);
    } else if (operation === "Divide") {
      return Lognormal.divide(n1, n2);
    }
    return undefined;
  }

  static operateFloatFirst(
    operation: Operation.AlgebraicOperation,
    n1: number,
    n2: Lognormal
  ): Lognormal | undefined {
    if (operation === "Multiply") {
      return n1 > 0
        ? new Lognormal({ mu: Math.log(n1) + n2.mu, sigma: n2.sigma })
        : undefined;
    } else if (operation === "Divide") {
      return n1 > 0
        ? new Lognormal({ mu: Math.log(n1) - n2.mu, sigma: n2.sigma })
        : undefined;
    }
    return undefined;
  }

  static operateFloatSecond(
    operation: Operation.AlgebraicOperation,
    n1: Lognormal,
    n2: number
  ) {
    if (operation === "Multiply") {
      return n2 > 0
        ? new Lognormal({ mu: n1.mu + Math.log(n2), sigma: n1.sigma })
        : undefined;
    } else if (operation === "Divide") {
      return n2 > 0
        ? new Lognormal({ mu: n1.mu - Math.log(n2), sigma: n1.sigma })
        : undefined;
    }
    return undefined;
  }
}

export class Uniform extends SymbolicDist {
  low: number;
  high: number;
  private constructor({ low, high }: { low: number; high: number }) {
    super();
    this.high = high;
    this.low = low;
  }

  static make({
    low,
    high,
  }: {
    low: number;
    high: number;
  }): result<Uniform, string> {
    if (high > low) {
      return Ok(new Uniform({ low, high }));
    } else {
      return Result.Err("High must be larger than low");
    }
  }

  protected override interpolateXs(opts: {
    xSelection: PointsetXSelection;
    points: number;
    env: Env;
  }): number[] {
    if (opts.xSelection === "ByWeight") {
      // In `ByWeight mode, uniform distributions get special treatment because we need two x's
      // on either side for proper rendering (just left and right of the discontinuities).
      const distance = this.high - this.low;
      const dx = magicNumbers.Epsilon.ten * distance;
      return [
        this.low - dx,
        this.low,
        this.low + dx,
        this.high - dx,
        this.high,
        this.high + dx,
      ];
    }
    return super.interpolateXs(opts);
  }
  toString() {
    return `Uniform(${this.low},${this.high})`;
  }

  simplePdf(x: number) {
    return jstat.uniform.pdf(x, this.low, this.high);
  }
  cdf(x: number) {
    return jstat.uniform.cdf(x, this.low, this.high);
  }
  inv(x: number) {
    return jstat.uniform.inv(x, this.low, this.high);
  }
  sample() {
    return jstat.uniform.sample(this.low, this.high);
  }
  mean() {
    return jstat.uniform.mean(this.low, this.high);
  }
  variance(): result<number, DistError> {
    return Ok(Math.pow(this.high - this.low, 2) / 12);
  }
  _isEqual(other: Uniform) {
    return this.low === other.low && this.high === other.high;
  }

  override min() {
    return this.low;
  }
  override max() {
    return this.high;
  }

  override truncate(
    left: number | undefined,
    right: number | undefined
  ): result<Uniform, DistError> {
    //todo: add check
    const newLow = Math.max(left ?? -Infinity, this.low);
    const newHigh = Math.min(right ?? Infinity, this.high);
    return Ok(new Uniform({ low: newLow, high: newHigh }));
  }
}

export class Logistic extends SymbolicDist {
  location: number;
  scale: number;
  private constructor({
    location,
    scale,
  }: {
    location: number;
    scale: number;
  }) {
    super();
    this.location = location;
    this.scale = scale;
  }

  static make({
    location,
    scale,
  }: {
    location: number;
    scale: number;
  }): result<Logistic, string> {
    if (scale > 0) {
      return Ok(new Logistic({ location, scale }));
    } else {
      return Result.Err("Scale must be positive");
    }
  }

  toString() {
    return `Logistic(${this.location},${this.scale})`;
  }

  simplePdf(x: number) {
    if (this.scale === 0) return this.location === x ? +Infinity : 0; // should never happen, scale is strictly positive
    const exp_delta = Math.pow(Math.E, -((x - this.location) / this.scale));
    return exp_delta / (this.scale * square(1 + exp_delta));
  }
  cdf(x: number) {
    if (this.scale === 0) return this.location < x ? 0 : 1; // should never happen, scale is strictly positive
    const exp_delta = Math.pow(Math.E, -((x - this.location) / this.scale));
    return 1 / (1 + exp_delta);
  }
  inv(p: number) {
    // p = 0 => Math.log(0) = -Infinity, fine
    // p = 1, scale > 0 => Math.log(Infinity) = Infinity, fine
    // p = 1, scale = 0 => trouble, special case
    if (this.scale == 0) return this.location;
    return this.location + this.scale * Math.log(p / (1 - p));
  }
  sample() {
    const s = Math.random();
    return this.inv(s);
  }
  mean() {
    return this.location;
  }

  variance(): Result.result<number, DistError> {
    return Result.Ok((square(this.scale) * square(Math.PI)) / 3);
  }
  _isEqual(other: Logistic) {
    return this.location === other.location && this.scale === other.scale;
  }
}

export class Bernoulli extends SymbolicDist {
  p: number;
  private constructor(p: number) {
    super();
    this.p = p;
  }

  static make(p: number): result<Bernoulli, string> {
    if (p >= 0.0 && p <= 1.0) {
      return Ok(new Bernoulli(p));
    } else {
      return Result.Err("Bernoulli parameter must be between 0 and 1");
    }
  }

  toString() {
    return `Bernoulli(${this.p})`;
  }
  private pmf(x: number) {
    return x === 0 ? 1 - this.p : this.p;
  }

  // Bernoulli is a discrete distribution, so it doesn't really have a pdf().
  // We fake this for now with the pmf function, but this should be fixed at some point.
  simplePdf(x: number) {
    return this.pmf(x);
  }
  cdf(x: number) {
    return x < 0 ? 0 : x >= 1 ? 1 : 1 - this.p;
  }
  inv(prob: number) {
    return prob <= 1 - this.p ? 0 : 1;
  }
  mean() {
    return this.p;
  }
  sample() {
    const s = Math.random();
    return this.inv(s);
  }
  _isEqual(other: Bernoulli) {
    return this.p === other.p;
  }

  override min() {
    return this.p === 1 ? 1 : 0;
  }
  override max() {
    return this.p === 0 ? 0 : 1;
  }

  variance(): Result.result<number, DistError> {
    return Ok(this.p * (1 - this.p));
  }

  override toPointSetDist(): result<PointSetDist, DistError> {
    return Ok(
      new PointSetDist(
        new DiscreteShape({
          integralSumCache: 1.0,
          xyShape: { xs: [0, 1], ys: [1 - this.p, this.p] },
        }).toMixed()
      )
    );
  }
}

export class Gamma extends SymbolicDist {
  shape: number;
  scale: number;
  private constructor({ shape, scale }: { shape: number; scale: number }) {
    super();
    this.shape = shape;
    this.scale = scale;
  }

  static make({
    shape,
    scale,
  }: {
    shape: number;
    scale: number;
  }): result<Gamma, string> {
    if (shape <= 0) {
      return Result.Err("shape must be larger than 0");
    }
    if (scale <= 0) {
      return Result.Err("scale must be larger than 0");
    }
    return Ok(new Gamma({ shape, scale }));
  }

  toString() {
    return `(${this.shape}, ${this.scale})`;
  }

  simplePdf(x: number) {
    return jstat.gamma.pdf(x, this.shape, this.scale);
  }
  cdf(x: number) {
    return jstat.gamma.cdf(x, this.shape, this.scale);
  }
  inv(x: number) {
    return jstat.gamma.inv(x, this.shape, this.scale);
  }
  sample() {
    return jstat.gamma.sample(this.shape, this.scale);
  }
  mean() {
    return jstat.gamma.mean(this.shape, this.scale);
  }
  variance(): Result.result<number, DistError> {
    return Ok(this.shape * this.scale * this.scale);
  }
  _isEqual(other: Gamma) {
    return this.shape === other.shape && this.scale === other.scale;
  }
}

export class PointMass extends SymbolicDist {
  constructor(public t: number) {
    super();
  }
  toString() {
    return `PointMass(${this.t})`;
  }
  static make(t: number): result<PointMass, string> {
    if (isFinite(t)) {
      return Ok(new PointMass(t));
    } else {
      return Result.Err("PointMass must be finite");
    }
  }

  simplePdf(x: number) {
    return x === this.t ? 1.0 : 0.0;
  }
  cdf(x: number) {
    return x >= this.t ? 1.0 : 0.0;
  }
  inv(p: number) {
    return this.t;
  }
  mean() {
    return this.t;
  }
  variance(): result<number, DistError> {
    return Ok(0);
  }
  sample() {
    return this.t;
  }
  _isEqual(other: PointMass) {
    return this.t === other.t;
  }

  override min() {
    return this.t;
  }
  override max() {
    return this.t;
  }

  override expectedConvolutionCost(): number {
    return magicNumbers.OpCost.floatCost;
  }

  override isFloat(): boolean {
    return true;
  }
  override toPointSetDist(): result<PointSetDist, DistError> {
    return Ok(
      new PointSetDist(
        new DiscreteShape({
          integralSumCache: 1.0,
          xyShape: { xs: [this.t], ys: [1.0] },
        }).toMixed()
      )
    );
  }
}

export class Binomial extends SymbolicDist {
  constructor(
    public n: number,
    public p: number
  ) {
    super();
  }
  toString() {
    return `Binomial(${this.n},{${this.p}})`;
  }
  static make(n: number, p: number): result<Binomial, string> {
    if (!Number.isInteger(n) || n < 0) {
      return Result.Err(
        "The number of trials (n) must be a non-negative integer."
      );
    }
    if (p < 0 || p > 1) {
      return Result.Err("Binomial p must be between 0 and 1");
    }
    return Ok(new Binomial(n, p));
  }

  simplePdf(x: number) {
    return jstat.binomial.pdf(x, this.n, this.p);
  }

  cdf(k: number) {
    return jstat.binomial.cdf(k, this.n, this.p);
  }

  // Not needed, until we support Sym.Binomial
  inv(p: number): number {
    throw notYetImplemented();
  }

  mean() {
    return this.n * this.p;
  }

  variance(): result<number, DistError> {
    return Ok(this.n * this.p * (1 - this.p));
  }

  sample() {
    const bernoulli = Bernoulli.make(this.p);
    if (bernoulli.ok) {
      // less space efficient than adding a bunch of draws, but cleaner. Taken from Guesstimate.
      return sum(
        Array.from({ length: this.n }, () => bernoulli.value.sample())
      );
    } else {
      throw new Error("Binomial sampling failed");
    }
  }

  _isEqual(other: Binomial) {
    return this.n === other.n && this.p === other.p;
  }

  // Not needed, until we support Sym.Binomial
  override toPointSetDist(): result<PointSetDist, DistError> {
    return Result.Err(notYetImplemented());
  }
}

export class Poisson extends SymbolicDist {
  constructor(public lambda: number) {
    super();
  }
  toString() {
    return `Poisson(${this.lambda}})`;
  }
  static make(lambda: number): result<Poisson, string> {
    if (lambda <= 0) {
      throw new Error(
        "Lambda must be a positive number for a Poisson distribution."
      );
    }

    return Ok(new Poisson(lambda));
  }

  simplePdf(x: number) {
    return jstat.poisson.pdf(x, this.lambda);
  }

  cdf(k: number) {
    return jstat.poisson.cdf(k, this.lambda);
  }

  // Not needed, until we support Sym.Poisson
  inv(p: number): number {
    throw new Error("Poisson inv not implemented");
  }

  mean() {
    return this.lambda;
  }

  variance(): result<number, DistError> {
    return Ok(this.lambda);
  }

  sample() {
    return jstat.poisson.sample(this.lambda);
  }

  _isEqual(other: Poisson) {
    return this.lambda === other.lambda;
  }

  // Not needed, until we support Sym.Poisson
  override toPointSetDist(): result<PointSetDist, DistError> {
    return Result.Err(notYetImplemented());
  }
}

/* Calling e.g. "Normal.operate" returns an optional Result.
   If the result is undefined, there is no valid analytic solution.
   If it's a Result object, it can still return an error if there is a serious problem,
   like in the case of a divide by 0.
*/
export const tryAnalyticalSimplification = (
  d1: SymbolicDist,
  d2: SymbolicDist,
  op: Operation.AlgebraicOperation
): result<SymbolicDist, OperationError> | undefined => {
  if (d1 instanceof PointMass && d2 instanceof PointMass) {
    return Result.fmap(
      Operation.Algebraic.toFn(op)(d1.t, d2.t),
      (v) => new PointMass(v)
    );
  } else if (d1 instanceof Normal && d2 instanceof Normal) {
    const out = Normal.operate(op, d1, d2);
    return out ? Ok(out) : undefined;
  } else if (d1 instanceof PointMass && d2 instanceof Normal) {
    const out = Normal.operateFloatFirst(op, d1.t, d2);
    return out ? Ok(out) : undefined;
  } else if (d1 instanceof Normal && d2 instanceof PointMass) {
    const out = Normal.operateFloatSecond(op, d1, d2.t);
    return out ? Ok(out) : undefined;
  } else if (d1 instanceof Lognormal && d2 instanceof Lognormal) {
    const out = Lognormal.operate(op, d1, d2);
    return out ? Ok(out) : undefined;
  } else if (d1 instanceof PointMass && d2 instanceof Lognormal) {
    const out = Lognormal.operateFloatFirst(op, d1.t, d2);
    return out ? Ok(out) : undefined;
  } else if (d1 instanceof Lognormal && d2 instanceof PointMass) {
    const out = Lognormal.operateFloatSecond(op, d1, d2.t);
    return out ? Ok(out) : undefined;
  } else {
    return undefined; // no solution
  }
};
