import { Value } from "../value/index.js";
import { Type } from "./Type.js";

export type OrType<T1, T2> = { tag: "1"; value: T1 } | { tag: "2"; value: T2 };

export class TOr<T1, T2> extends Type<OrType<T1, T2>> {
  constructor(
    private type1: Type<T1>,
    private type2: Type<T2>
  ) {
    super();
  }

  unpack(v: Value): OrType<T1, T2> | undefined {
    const unpackedType1Value = this.type1.unpack(v);
    if (unpackedType1Value !== undefined) {
      return { tag: "1", value: unpackedType1Value };
    }
    const unpackedType2Value = this.type2.unpack(v);
    if (unpackedType2Value !== undefined) {
      return { tag: "2", value: unpackedType2Value };
    }
    return undefined;
  }

  pack(v: OrType<T1, T2>) {
    return v.tag === "1" ? this.type1.pack(v.value) : this.type2.pack(v.value);
  }

  override display() {
    return `${this.type1.display()}|${this.type2.display()}`;
  }

  override defaultFormInputCode() {
    return this.type1.defaultFormInputCode();
  }

  override defaultFormInputType() {
    return this.type1.defaultFormInputType();
  }
}

export function tOr<T1, T2>(type1: Type<T1>, type2: Type<T2>) {
  return new TOr(type1, type2);
}
