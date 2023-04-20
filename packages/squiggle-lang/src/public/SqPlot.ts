import { BaseDist } from "../dist/BaseDist.js";
import { SampleSetDist } from "../dist/SampleSetDist/index.js";
import { Env } from "../dist/env.js";
import * as Result from "../utility/result.js";
import { Plot, vPlot } from "../value/index.js";
import { SqSampleSetDistribution, wrapDistribution } from "./SqDistribution.js";
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
    case "scatter":
      return new SqScatterPlot(value, location);
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

export class SqScatterPlot extends SqAbstractPlot<"scatter"> {
  tag = "scatter" as const;

  private buildSampleSetDist(
    dist: BaseDist,
    env: Env
  ): Result.result<SqSampleSetDistribution, SqError> {
    const sampleSetResult = SampleSetDist.fromDist(dist, env);
    if (!sampleSetResult.ok) {
      return Result.Error(
        SqError.createOtherError("Conversion to SampleSet failed")
      );
    }
    return Result.Ok(new SqSampleSetDistribution(sampleSetResult.value));
  }

  xDist(env: Env): Result.result<SqSampleSetDistribution, SqError> {
    return this.buildSampleSetDist(this._value.xDist, env);
  }
  yDist(env: Env): Result.result<SqSampleSetDistribution, SqError> {
    return this.buildSampleSetDist(this._value.yDist, env);
  }

  get logX(): boolean {
    return this._value.logX;
  }
  get logY(): boolean {
    return this._value.logY;
  }

  static zipToPoints(
    xDist: SqSampleSetDistribution,
    yDist: SqSampleSetDistribution
  ): { x: number; y: number }[] {
    const xSamples = xDist.getSamples();
    const ySamples = yDist.getSamples();
    if (xSamples.length !== ySamples.length) {
      throw new Error("Sample count mismatch");
    }
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < xSamples.length; i++) {
      points.push({ x: xSamples[i], y: ySamples[i] });
    }
    return points;
  }
}

export type SqPlot = SqDistributionsPlot | SqFnPlot | SqScatterPlot;
