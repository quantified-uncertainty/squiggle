import { Plot, vPlot } from "../value/index.js";
import { wrapDistribution } from "./SqDistribution.js";
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

  get dist1() {
    return wrapDistribution(this._value.dist1);
  }
  get dist2() {
    return wrapDistribution(this._value.dist2);
  }
}

export type SqPlot = SqDistributionsPlot | SqFnPlot | SqJointPlot;
