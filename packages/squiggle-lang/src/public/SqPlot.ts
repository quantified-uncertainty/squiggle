import { SampleSetDist } from "../dist/SampleSetDist/index.js";
import { Env } from "../dist/env.js";
import { zip } from "../utility/E_A.js";
import * as Result from "../utility/result.js";
import { Plot, vPlot } from "../value/index.js";
import { wrapDistribution } from "./SqDistribution.js";
import { SqError } from "./SqError.js";
import { SqLambda } from "./SqLambda.js";
import { SqPlotValue } from "./SqValue.js";
import { SqValueLocation } from "./SqValueLocation.js";

export const wrapPlot = (value: Plot, location: SqValueLocation): SqPlot => {
  switch (value.type) {
    case "distributions":
      return new SqDistributionsPlot(value, location);
    case "fn":
      return new SqFnPlot(value, location);
    case "joint":
      return new SqJointPlot(value, location);
  }
};

abstract class SqAbstractPlot<T extends Plot["type"]> {
  abstract tag: T;

  constructor(
    protected _value: Extract<Plot, { type: T }>,
    public location: SqValueLocation
  ) {}

  toString() {
    return vPlot(this._value).toString();
  }

  asValue() {
    return new SqPlotValue(vPlot(this._value), this.location);
  }
}

export class SqDistributionsPlot extends SqAbstractPlot<"distributions"> {
  tag = "distributions" as const;

  get distributions() {
    return this._value.distributions.map(({ name, distribution }) => ({
      name,
      distribution: wrapDistribution(distribution),
    }));
  }
}

export class SqFnPlot extends SqAbstractPlot<"fn"> {
  tag = "fn" as const;

  get fn() {
    return new SqLambda(
      this._value.fn,
      new SqValueLocation(this.location.project, this.location.sourceId, {
        ...this.location.path,
        items: [...this.location.path.items, "fn"],
      })
    );
  }
  get min() {
    return this._value.min;
  }
  get max() {
    return this._value.max;
  }
}

export class SqJointPlot extends SqAbstractPlot<"joint"> {
  tag = "joint" as const;

  get yDist() {
    return wrapDistribution(this._value.xDist);
  }
  get xDist() {
    return wrapDistribution(this._value.yDist);
  }

  points(env: Env): Result.result<{ x: number; y: number }[], SqError> {
    const xSamplesValue = SampleSetDist.fromDist(this._value.xDist, env);
    const ySamplesValue = SampleSetDist.fromDist(this._value.yDist, env);

    if (!xSamplesValue.ok || !ySamplesValue.ok) {
      return Result.Error(
        SqError.createOtherError("Conversion to SampleSet failed")
      );
    }

    const xSamples = xSamplesValue.value.samples;
    const ySamples = ySamplesValue.value.samples;
    if (xSamples.length !== ySamples.length) {
      return Result.Error(SqError.createOtherError("Sample count mismatch"));
    }
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < xSamples.length; i++) {
      points.push({ x: xSamples[i], y: ySamples[i] });
    }
    return Result.Ok(points);
  }
}

export type SqPlot = SqDistributionsPlot | SqFnPlot | SqJointPlot;
