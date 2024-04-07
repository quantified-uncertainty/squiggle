import jstat from "jstat";
import sum from "lodash/sum.js";

import { PRNG } from "../../rng/index.js";
import * as Result from "../../utility/result.js";
import { Ok, result } from "../../utility/result.js";
import { DistError, notYetImplemented } from "../DistError.js";
import { PointSetDist } from "../PointSetDist.js";
import { BaseSymbolicDist } from "./BaseSymbolicDist.js";
import { Bernoulli } from "./Bernoulli.js";

type Args = {
  n: number;
  p: number;
};

export class Binomial extends BaseSymbolicDist<"Binomial", Args> {
  readonly symbolicType = "Binomial";

  constructor(
    public n: number,
    public p: number
  ) {
    super();
  }
  toString() {
    return `Binomial(${this.n},{${this.p}})`;
  }
  static make({ n, p }: Args): result<Binomial, string> {
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

  override getArgs() {
    return {
      n: this.n,
      p: this.p,
    };
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

  sample(rng: PRNG) {
    const bernoulli = Bernoulli.make(this.p);
    if (bernoulli.ok) {
      // less space efficient than adding a bunch of draws, but cleaner. Taken from Guesstimate.
      return sum(
        Array.from({ length: this.n }, () => bernoulli.value.sample(rng))
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
