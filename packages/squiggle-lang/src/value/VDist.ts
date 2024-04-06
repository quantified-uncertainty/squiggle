import { BaseDist } from "../dist/BaseDist.js";
import { SampleSetDist } from "../dist/SampleSetDist/index.js";
import { BaseValue } from "./BaseValue.js";
import { Value } from "./index.js";

type SerializedDist = {
  type: "SampleSet";
  value: readonly number[];
};

export class VDist extends BaseValue<"Dist", SerializedDist> {
  readonly type = "Dist";

  override get publicName() {
    return "Distribution";
  }

  constructor(public value: BaseDist) {
    super();
  }

  valueToString() {
    return this.value.toString();
  }

  isEqual(other: VDist) {
    return this.value.isEqual(other.value);
  }

  override serialize(traverse: (value: Value) => number): SerializedDist {
    if (this.value instanceof SampleSetDist) {
      return {
        type: "SampleSet",
        value: this.value.samples,
      };
    }
    throw new Error("Not implemented");
  }

  static deserialize(value: SerializedDist): VDist {
    if (value.type === "SampleSet") {
      const dist = SampleSetDist.make(value.value);
      if (!dist.ok) {
        throw dist.value;
      }
      return new VDist(dist.value);
    }

    throw new Error("Not implemented");
  }
}

export const vDist = (v: BaseDist) => new VDist(v);
