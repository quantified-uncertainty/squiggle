import jstat from "jstat";

import * as Result from "../../utility/result.js";
import { Ok, result } from "../../utility/result.js";
import { DistError } from "../DistError.js";
import { BaseSymbolicDist } from "./BaseSymbolicDist.js";

type Args = {
  local: number;
  scale: number;
};

export class Cauchy extends BaseSymbolicDist<"Cauchy", Args> {
  readonly symbolicType = "Cauchy";

  local: number;
  scale: number;
  private constructor({ local, scale }: Args) {
    super();
    this.local = local;
    this.scale = scale;
  }

  static make({ local, scale }: Args): result<Cauchy, string> {
    if (scale > 0) {
      return Ok(new Cauchy({ local, scale }));
    } else {
      return Result.Err(
        "Cauchy distribution scale parameter must larger than 0."
      );
    }
  }

  getArgs() {
    return {
      local: this.local,
      scale: this.scale,
    };
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
