import { BaseDist } from "../dist/BaseDist.js";
import { PointSetDist } from "../dist/PointSetDist.js";
import { SampleSetDist } from "../dist/SampleSetDist/index.js";
import { BaseSymbolicDist } from "../dist/SymbolicDist/BaseSymbolicDist.js";
import {
  assertIsKnownSymbolicDist,
  deserializeSymbolicDist,
  SerializedSymbolicDist,
} from "../dist/SymbolicDist/index.js";
import { SerializedMixedShape } from "../PointSet/Mixed.js";
import { BaseValue } from "./BaseValue.js";

export type SerializedDist =
  | {
      type: "Symbolic";
      value: SerializedSymbolicDist;
    }
  | {
      type: "SampleSet";
      value: readonly number[];
    }
  | {
      type: "PointSet";
      value: SerializedMixedShape;
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

  override serializePayload(): SerializedDist {
    if (this.value instanceof PointSetDist) {
      return {
        type: "PointSet",
        value: this.value.serialize(),
      };
    } else if (this.value instanceof SampleSetDist) {
      return {
        type: "SampleSet",
        value: this.value.serialize(),
      };
    } else if (this.value instanceof BaseSymbolicDist) {
      assertIsKnownSymbolicDist(this.value);
      return {
        type: "Symbolic",
        value: this.value.serialize(),
      };
    } else {
      throw new Error(`Unknown dist type ${this.value.type}`);
    }
  }

  static deserialize(value: SerializedDist): VDist {
    switch (value.type) {
      case "Symbolic":
        return new VDist(deserializeSymbolicDist(value.value));
      case "SampleSet":
        return new VDist(SampleSetDist.deserialize(value.value));
      case "PointSet":
        return new VDist(PointSetDist.deserialize(value.value));
      default:
        throw new Error(`Unknown dist ${value}`);
    }
  }
}

export const vDist = (v: BaseDist) => new VDist(v);
