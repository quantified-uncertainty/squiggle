import { clamp, sort, uniq } from "../../utility/E_A_Floats.js";
import { Plot, vPlot } from "../../value/VPlot.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqValuePathEdge } from "../SqValuePath.js";
import { SqPlotValue } from "./index.js";
import {
  SqDistribution,
  SqSampleSetDistribution,
  wrapDistribution,
} from "./SqDistribution/index.js";
import { SqLambda } from "./SqLambda.js";
import { SqScale, wrapScale } from "./SqScale.js";

type LabeledSqDistribution = {
  name?: string;
  distribution: SqDistribution;
};

export function wrapPlot(value: Plot, context?: SqValueContext): SqPlot {
  switch (value.type) {
    case "distributions":
      return new SqDistributionsPlot(value, context);
    case "numericFn":
      return new SqNumericFnPlot(value, context);
    case "distFn":
      return new SqDistFnPlot(value, context);
    case "scatter":
      return new SqScatterPlot(value, context);
    case "relativeValues":
      return new SqRelativeValuesPlot(value, context);
  }
}

abstract class SqAbstractPlot<T extends Plot["type"]> {
  abstract tag: T;

  constructor(
    protected _value: Extract<Plot, { type: T }>,
    public context?: SqValueContext
  ) {}

  toString() {
    return vPlot(this._value).toString();
  }

  get asValue() {
    return new SqPlotValue(vPlot(this._value), this.context);
  }

  get title(): string | undefined {
    return this._value.title;
  }
}

function getXPointsWithParams(
  points: number[] | undefined,
  {
    min,
    max,
    requestedXPoints,
  }: {
    min?: number;
    max?: number;
    requestedXPoints?: number[];
  }
) {
  const combinedPoints = [...(requestedXPoints || []), ...(points || [])];
  //Technically, we don't need sort(uniq()) if it's just ``points``, but it's not worth the extra logic to avoid it.
  return sort(uniq(clamp(combinedPoints, { min, max })));
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

export class SqNumericFnPlot extends SqAbstractPlot<"numericFn"> {
  tag = "numericFn" as const;
  // Necessary because wrapped fn path is different based on whether this is a real `Plot.fn` or a wrapper in the components.
  // This can be removed when we get direct lambda evaluation back.
  private createdProgrammatically = false;

  static create({
    fn,
    xScale,
    yScale,
    xPoints,
    title,
  }: {
    fn: SqLambda;
    xScale: SqScale;
    yScale: SqScale;
    xPoints?: number[];
    title?: string;
  }) {
    const result = new SqNumericFnPlot(
      {
        type: "numericFn",
        fn: fn._value,
        xScale: xScale._value,
        yScale: yScale._value,
        title: title,
        xPoints,
      },
      fn.context
    );
    result.createdProgrammatically = true;
    return result;
  }

  get fn() {
    return new SqLambda(
      this._value.fn,
      this.context
        ? this.createdProgrammatically
          ? this.context
          : this.context.extend(SqValuePathEdge.fromKey("fn"))
        : undefined
    );
  }

  get xScale() {
    return wrapScale(this._value.xScale);
  }

  get yScale() {
    return wrapScale(this._value.yScale);
  }

  xPoints(params: {
    min?: number;
    max?: number;
    requestedXPoints?: number[];
  }): number[] {
    return getXPointsWithParams(this._value.xPoints, params);
  }

  override toString() {
    return this.fn.toString(); // TODO - scale info?
  }
}

// TODO - mostly copy-pasted from SqNumericFnPlot, how can we avoid this?
export class SqDistFnPlot extends SqAbstractPlot<"distFn"> {
  tag = "distFn" as const;
  private createdProgrammatically = false;

  static create({
    fn,
    xScale,
    yScale,
    distXScale,
    title,
    xPoints,
  }: {
    fn: SqLambda;
    xScale: SqScale;
    yScale: SqScale;
    distXScale: SqScale;
    title?: string;
    xPoints?: number[];
  }) {
    const result = new SqDistFnPlot(
      {
        type: "distFn",
        fn: fn._value,
        xScale: xScale._value,
        yScale: yScale._value,
        distXScale: distXScale._value,
        title: title,
        xPoints,
      },
      fn.context
    );
    result.createdProgrammatically = true;
    return result;
  }

  get fn() {
    return new SqLambda(
      this._value.fn,
      this.context
        ? this.createdProgrammatically
          ? this.context
          : this.context.extend(SqValuePathEdge.fromKey("fn"))
        : undefined
    );
  }

  get xScale() {
    return wrapScale(this._value.xScale);
  }

  get yScale() {
    return wrapScale(this._value.yScale);
  }

  get distXScale() {
    return wrapScale(this._value.distXScale);
  }

  xPoints(params: {
    min?: number;
    max?: number;
    requestedXPoints?: number[];
  }): number[] {
    return getXPointsWithParams(this._value.xPoints, params);
  }

  override toString() {
    return this.fn.toString(); // TODO - scale info?
  }
}

export class SqScatterPlot extends SqAbstractPlot<"scatter"> {
  tag = "scatter" as const;

  xDist(): SqSampleSetDistribution {
    return new SqSampleSetDistribution(this._value.xDist);
  }
  yDist(): SqSampleSetDistribution {
    return new SqSampleSetDistribution(this._value.yDist);
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

export class SqRelativeValuesPlot extends SqAbstractPlot<"relativeValues"> {
  tag = "relativeValues" as const;

  get ids(): readonly string[] {
    return this._value.ids;
  }

  get fn(): SqLambda {
    return new SqLambda(
      this._value.fn,
      this.context?.extend(SqValuePathEdge.fromKey("fn"))
    );
  }
}

export type SqPlot =
  | SqDistributionsPlot
  | SqNumericFnPlot
  | SqDistFnPlot
  | SqScatterPlot
  | SqRelativeValuesPlot;
