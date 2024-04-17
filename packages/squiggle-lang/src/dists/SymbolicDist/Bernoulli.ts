import { DiscreteShape } from "../../PointSet/Discrete.js";
import { PRNG } from "../../rng/index.js";
import * as Result from "../../utility/result.js";
import { Ok, result } from "../../utility/result.js";
import { DistError } from "../DistError.js";
import { PointSetDist } from "../PointSetDist.js";
import { BaseSymbolicDist } from "./BaseSymbolicDist.js";

export class Bernoulli extends BaseSymbolicDist<"Bernoulli", number> {
  readonly symbolicType = "Bernoulli";
  p: number;
  private constructor(p: number) {
    super();
    this.p = p;
  }

  static make(p: number): result<Bernoulli, string> {
    if (p >= 0 && p <= 1) {
      return Ok(new Bernoulli(p));
    } else {
      return Result.Err("Bernoulli parameter must be between 0 and 1");
    }
  }

  getArgs() {
    return this.p;
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
  sample(rng: PRNG) {
    const s = rng();
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
          integralSumCache: 1,
          xyShape: { xs: [0, 1], ys: [1 - this.p, this.p] },
        }).toMixed()
      )
    );
  }
}
