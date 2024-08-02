import { BaseDist } from "../dists/BaseDist.js";
import { PointSetDist } from "../dists/PointSetDist.js";
import { SampleSetDist } from "../dists/SampleSetDist/index.js";
import { BaseSymbolicDist } from "../dists/SymbolicDist/BaseSymbolicDist.js";
import { SymbolicDist } from "../dists/SymbolicDist/index.js";
import { Value, vDist } from "../value/index.js";
import { Type } from "./Type.js";

export type DistClass<T extends BaseDist> = { new (...args: any[]): T };

export class TDist<T extends BaseDist> extends Type<T> {
  distClass?: DistClass<T>;
  defaultCode: string;

  constructor(props: { distClass?: DistClass<T>; defaultCode: string }) {
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

  override isSupertype(other: Type<unknown>): boolean {
    return (
      other instanceof TDist &&
      // either this is a generic dist or the dist classes match
      (!this.distClass || this.distClass === other.distClass)
    );
  }

  override defaultFormInputCode() {
    return this.defaultCode;
  }
}

export const tDist = new TDist({ defaultCode: "PointSet(normal(1,1))" });

export const tPointSetDist = new TDist({
  distClass: PointSetDist,
  defaultCode: "normal(1,1)",
});

export const tSampleSetDist = new TDist({
  distClass: SampleSetDist,
  defaultCode: "normal(1,1)",
});

export const tSymbolicDist = new TDist<SymbolicDist>({
  distClass: BaseSymbolicDist as any,
  defaultCode: "Sym.normal(1,1)",
});
