import { BaseDist } from "../dist/BaseDist.js";
import { REOther } from "../errors/messages.js";
import { Lambda } from "../reducer/lambda.js";
import { BaseValue } from "./BaseValue.js";
import { Value } from "./index.js";
import { Indexable } from "./mixins.js";
import { vLambda } from "./vLambda.js";
import { Scale } from "./VScale.js";

export type LabeledDistribution = {
  name?: string;
  distribution: BaseDist;
};

export type CommonPlotArgs = {
  title?: string;
};

export type Plot = CommonPlotArgs &
  (
    | {
        type: "distributions";
        distributions: readonly LabeledDistribution[];
        xScale: Scale;
        yScale: Scale;
        showSummary: boolean;
      }
    | {
        type: "numericFn";
        fn: Lambda;
        xScale: Scale;
        yScale: Scale;
        xPoints?: number[];
      }
    | {
        type: "distFn";
        fn: Lambda;
        xScale: Scale;
        yScale: Scale;
        distXScale: Scale;
        xPoints?: number[];
      }
    | {
        type: "scatter";
        xDist: BaseDist;
        yDist: BaseDist;
        xScale: Scale;
        yScale: Scale;
      }
    | {
        type: "relativeValues";
        fn: Lambda;
        ids: readonly string[];
      }
  );

export class VPlot extends BaseValue implements Indexable {
  readonly type = "Plot";

  constructor(public value: Plot) {
    super();
  }

  valueToString() {
    switch (this.value.type) {
      case "distributions":
        return `Plot containing ${this.value.distributions
          .map((x) => x.name)
          .join(", ")}`;
      case "numericFn":
        return `Plot for numeric function ${this.value.fn}`;
      case "distFn":
        return `Plot for dist function ${this.value.fn}`;
      case "scatter":
        return `Scatter plot for distributions ${this.value.xDist} and ${this.value.yDist}`;
      case "relativeValues":
        return `Plot for relative values ${this.value.ids.join(", ")}`;
    }
  }

  get(key: Value) {
    if (
      key.type === "String" &&
      key.value === "fn" &&
      (this.value.type === "numericFn" ||
        this.value.type === "distFn" ||
        this.value.type === "relativeValues")
    ) {
      return vLambda(this.value.fn);
    }

    throw new REOther("Trying to access non-existent field");
  }
}

export const vPlot = (plot: Plot) => new VPlot(plot);
