import * as RSPlot from "../rescript/ForTS/ForTS_SquiggleValue/ForTS_SquiggleValue_Plot.gen";
import { SqDistribution, wrapDistribution } from "./SqDistribution";
import { SqValueLocation } from "./SqValueLocation";

type T = RSPlot.squiggleValue_Plot;

export type LabeledDistribution = {
  name: string;
  distribution: SqDistribution;
};

export class SqPlot {
  constructor(private _value: T, public location: SqValueLocation) {}

  getDistributions(): LabeledDistribution[] {
    return this._value.distributions.map((v: RSPlot.labeledDistribution) => ({
      ...v,
      distribution: wrapDistribution(v.distribution),
    }));
  }

  toString() {
    return RSPlot.toString(this._value);
  }
}
