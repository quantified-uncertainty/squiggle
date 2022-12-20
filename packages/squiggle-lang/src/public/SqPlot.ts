import { Plot, vPlot } from "../value";
import { wrapDistribution } from "./SqDistribution";
import { SqPlotValue } from "./SqValue";
import { SqValueLocation } from "./SqValueLocation";

export class SqPlot {
  constructor(private _value: Plot, public location: SqValueLocation) {}

  get distributions() {
    return this._value.distributions.map(({ name, distribution }) => ({
      name,
      distribution: wrapDistribution(distribution),
    }));
  }

  toString() {
    return vPlot(this._value).toString();
  }

  asValue() {
    return new SqPlotValue(vPlot(this._value), this.location);
  }
}
