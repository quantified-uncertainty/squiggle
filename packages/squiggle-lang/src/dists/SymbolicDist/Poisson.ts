import jstat from "jstat";

import * as Result from "../../utility/result.js";
import { Ok, result } from "../../utility/result.js";
import { DistError, notYetImplemented } from "../DistError.js";
import { PointSetDist } from "../PointSetDist.js";
import { BaseSymbolicDist } from "./BaseSymbolicDist.js";

export class Poisson extends BaseSymbolicDist<"Poisson", number> {
  readonly symbolicType = "Poisson";

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

  override getArgs() {
    return this.lambda;
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
