import { BaseDist } from "../dists/BaseDist.js";
import { PointSetDist } from "../dists/PointSetDist.js";
import { SampleSetDist } from "../dists/SampleSetDist/index.js";
import { BaseSymbolicDist } from "../dists/SymbolicDist/BaseSymbolicDist.js";
import { SymbolicDist } from "../dists/SymbolicDist/index.js";
import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value, vDist } from "../value/index.js";
import { SerializedType } from "./serialize.js";
import { TAny, Type } from "./Type.js";

export type DistClass<T extends BaseDist> = { new (...args: any[]): T };

export class TDist<T extends BaseDist> extends Type<T> {
  distClass?: DistClass<T>;
  defaultCode: string;

  // Constructor is private because we can serialize only three specific instances of TDist types.
  // So it would be bad if someone attempted to construct e.g. `new TDist(Normal)`.
  private constructor(props: {
    distClass?: DistClass<T>;
    defaultCode: string;
  }) {
    super();
    this.distClass = props.distClass;
    this.defaultCode = props.defaultCode;
  }

  unpack(v: Value) {
    if (v.type !== "Dist") return undefined;

    if (this.distClass && !(v.value instanceof this.distClass))
      return undefined;

    return v.value as T;
  }

  pack(v: T) {
    return vDist(v);
  }

  override serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return {
      kind: "Dist",
      distClass:
        (this.distClass as any) === BaseSymbolicDist
          ? "Symbolic"
          : (this.distClass as any) === PointSetDist
            ? "PointSet"
            : (this.distClass as any) === SampleSetDist
              ? "SampleSet"
              : undefined,
    };
    throw new Error("Method not implemented.");
  }

  override isSupertype(other: Type<unknown>): boolean {
    if (other instanceof TAny) return true;
    return (
      other instanceof TDist &&
      // either this is a generic dist or the dist classes match
      (!this.distClass || this.distClass === other.distClass)
    );
  }

  override defaultFormInputCode() {
    return this.defaultCode;
  }

  static tPointSetDist = new TDist({
    distClass: PointSetDist,
    defaultCode: "PointSet(normal(1,1))",
  });

  static tSampleSetDist = new TDist({
    distClass: SampleSetDist,
    defaultCode: "normal(1,1)",
  });

  static tSymbolicDist = new TDist<SymbolicDist>({
    distClass: BaseSymbolicDist as any,
    defaultCode: "Sym.normal(1,1)",
  });

  static tDist = new TDist({ defaultCode: "normal(1,1)" });
}

export const { tDist, tPointSetDist, tSampleSetDist, tSymbolicDist } = TDist;
