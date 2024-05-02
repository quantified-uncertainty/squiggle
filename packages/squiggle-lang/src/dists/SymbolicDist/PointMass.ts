import * as magicNumbers from "../../magicNumbers.js";
import { DiscreteShape } from "../../PointSet/Discrete.js";
import * as Result from "../../utility/result.js";
import { Ok, result } from "../../utility/result.js";
import { DistError } from "../DistError.js";
import { PointSetDist } from "../PointSetDist.js";
import { BaseSymbolicDist } from "./BaseSymbolicDist.js";

export class PointMass extends BaseSymbolicDist<"PointMass", number> {
  readonly symbolicType = "PointMass";

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

  getArgs() {
    return this.t;
  }

  simplePdf(x: number) {
    return x === this.t ? 1 : 0;
  }
  cdf(x: number) {
    return x >= this.t ? 1 : 0;
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
          integralSumCache: 1,
          xyShape: { xs: [this.t], ys: [1] },
        }).toMixed()
      )
    );
  }
}
