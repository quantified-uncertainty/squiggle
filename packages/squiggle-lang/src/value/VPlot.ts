import { BaseDist } from "../dist/BaseDist.js";
import { SampleSetDist } from "../dist/SampleSetDist/index.js";
import { REOther } from "../errors/messages.js";
import { Lambda } from "../reducer/lambda.js";
import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../serialization/squiggle.js";
import { BaseValue } from "./BaseValue.js";
import { Value, vDist } from "./index.js";
import { Indexable } from "./mixins.js";
import { SerializedDist, VDist } from "./VDist.js";
import { SerializedLambda, vLambda, VLambda } from "./vLambda.js";
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
        xDist: SampleSetDist;
        yDist: SampleSetDist;
        xScale: Scale;
        yScale: Scale;
      }
    | {
        type: "relativeValues";
        fn: Lambda;
        ids: readonly string[];
      }
  );

type TypedPlot<T extends Plot["type"]> = Extract<Plot, { type: T }>;

export type SerializedLabeledDistribution = {
  name: string | null;
  distribution: SerializedDist;
};

type SerializedPlot =
  | (Omit<TypedPlot<"distributions">, "distributions"> & {
      distributions: readonly SerializedLabeledDistribution[];
    })
  | (Omit<TypedPlot<"numericFn">, "fn"> & {
      fn: SerializedLambda;
    })
  | (Omit<TypedPlot<"distFn">, "fn"> & {
      fn: SerializedLambda;
    })
  | (Omit<TypedPlot<"scatter">, "xDist" | "yDist"> & {
      xDist: SerializedDist;
      yDist: SerializedDist;
    })
  | (Omit<TypedPlot<"relativeValues">, "fn"> & {
      fn: SerializedLambda;
    });

export class VPlot
  extends BaseValue<"Plot", SerializedPlot>
  implements Indexable
{
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

  override serializePayload(
    visit: SquiggleSerializationVisitor
  ): SerializedPlot {
    switch (this.value.type) {
      case "distributions":
        return {
          ...this.value,
          distributions: this.value.distributions.map((labeledDist) => ({
            name: labeledDist.name ?? null,
            distribution: vDist(labeledDist.distribution).serializePayload(),
          })),
        };
      case "numericFn":
      case "distFn":
        return {
          ...this.value,
          fn: vLambda(this.value.fn).serializePayload(visit),
        };
      case "scatter":
        return {
          ...this.value,
          xDist: vDist(this.value.xDist).serializePayload(),
          yDist: vDist(this.value.yDist).serializePayload(),
        };
      case "relativeValues":
        return {
          ...this.value,
          fn: vLambda(this.value.fn).serializePayload(visit),
        };
    }
  }

  static deserialize(
    value: SerializedPlot,
    visit: SquiggleDeserializationVisitor
  ): VPlot {
    switch (value.type) {
      case "distributions":
        return new VPlot({
          ...value,
          distributions: value.distributions.map((labeledDist) => ({
            name: labeledDist.name ?? undefined,
            distribution: VDist.deserialize(labeledDist.distribution).value,
          })),
        });
      case "numericFn":
      case "distFn":
        return new VPlot({
          ...value,
          fn: VLambda.deserialize(value.fn, visit).value,
        });
      case "scatter": {
        const xDist = VDist.deserialize(value.xDist).value;
        const yDist = VDist.deserialize(value.yDist).value;
        if (!(xDist instanceof SampleSetDist)) {
          throw new Error("Expected xDist to be a SampleSetDist");
        }
        if (!(yDist instanceof SampleSetDist)) {
          throw new Error("Expected yDist to be a SampleSetDist");
        }
        return new VPlot({
          ...value,
          xDist,
          yDist,
        });
      }
      case "relativeValues":
        return new VPlot({
          ...value,
          fn: VLambda.deserialize(value.fn, visit).value,
        });
    }
  }
}

export const vPlot = (plot: Plot) => new VPlot(plot);
