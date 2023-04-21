import { BaseDist } from "../dist/BaseDist.js";
import { SampleSetDist } from "../dist/SampleSetDist/index.js";
import { Env } from "../dist/env.js";
import * as Result from "../utility/result.js";
import { Plot, vPlot } from "../value/index.js";
import {
  SqDistribution,
  SqSampleSetDistribution,
  wrapDistribution,
} from "./SqDistribution.js";
import { SqError } from "./SqError.js";
import { SqLambda } from "./SqLambda.js";
import { SqLinearScale, SqScale, wrapScale } from "./SqScale.js";
import { SqPlotValue } from "./SqValue.js";
import { SqValueLocation } from "./SqValueLocation.js";

type LabeledSqDistribution = {
  name?: string;
  distribution: SqDistribution;
};

export const wrapPlot = (value: Plot, location?: SqValueLocation): SqPlot => {
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
    public location?: SqValueLocation
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

  static create({
    distribution,
    xScale,
    yScale,
    showSummary,
    title,
  }: {
    distribution: SqDistribution;
    xScale: SqScale;
    yScale: SqScale;
    showSummary: boolean;
    title?: string;
  }) {
    return new SqDistributionsPlot({
      type: "distributions",
      distributions: [{ distribution: distribution._value }],
      xScale: xScale._value,
      yScale: yScale._value,
      showSummary,
      title,
    });
  }

  get distributions(): LabeledSqDistribution[] {
    return this._value.distributions.map(({ name, distribution }) => ({
      name,
      distribution: wrapDistribution(distribution),
    }));
  }

  get title(): string | undefined {
    return this._value.title;
  }

  get showSummary(): boolean {
    return this._value.showSummary;
  }

  get xScale(): SqScale {
    return wrapScale(this._value.xScale);
  }

  get yScale(): SqScale {
    return wrapScale(this._value.yScale);
  }
}

export class SqFnPlot extends SqAbstractPlot<"fn"> {
  tag = "fn" as const;
  // Necessary because wrapped fn location is different based on whether this is a real `Plot.fn` or a wrapper in the components.
  // This can be removed when we get direct lambda evaluation back.
  private createdProgrammatically: boolean = false;

  static create({
    fn,
    xScale,
    points,
  }: {
    fn: SqLambda;
    xScale: SqScale;
    points?: number;
  }) {
    const result = new SqFnPlot(
      {
        type: "fn",
        fn: fn._value,
        xScale: xScale._value,
        points,
      },
      fn.location
    );
    result.createdProgrammatically = true;
    return result;
  }

  get fn() {
    return new SqLambda(
      this._value.fn,
      this.location
        ? this.createdProgrammatically
          ? this.location
          : new SqValueLocation(this.location.project, this.location.sourceId, {
              ...this.location.path,
              items: [...this.location.path.items, "fn"],
            })
        : undefined
    );
  }

  get xScale() {
    return wrapScale(this._value.xScale);
  }

  get points(): number | undefined {
    return this._value.points;
  }

  toString() {
    return this.fn.toString(); // TODO - scale info?
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

  get xScale(): SqScale | undefined {
    const scale = this._value.xScale;
    return scale ? wrapScale(scale) : undefined;
  }
  get yScale(): SqScale | undefined {
    const scale = this._value.yScale;
    return scale ? wrapScale(scale) : undefined;
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
