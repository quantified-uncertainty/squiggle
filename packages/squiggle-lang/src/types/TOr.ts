import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value } from "../value/index.js";
import { SerializedType } from "./serialize.js";
import { TAny, Type } from "./Type.js";

export type OrType<T1, T2> = { tag: "1"; value: T1 } | { tag: "2"; value: T2 };

// TODO - this only supports union types of 2 types. We should support more than
// 2 types, but it's not clear how to implement pack/unpack for that.
export class TOr<T1, T2> extends Type<OrType<T1, T2>> {
  constructor(
    private type1: Type<T1>,
    private type2: Type<T2>
  ) {
    super();
  }

  check(v: Value): boolean {
    return this.unpack(v) !== undefined;
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

  override serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return {
      kind: "Or",
      type1: visit.type(this.type1),
      type2: visit.type(this.type2),
    };
  }

  override isSupertypeOf(other: Type<unknown>) {
    if (other instanceof TAny) return true;
    if (other instanceof TOr) {
      return (
        (this.type1.isSupertypeOf(other.type1) &&
          this.type2.isSupertypeOf(other.type2)) ||
        (this.type1.isSupertypeOf(other.type2) &&
          this.type2.isSupertypeOf(other.type1))
      );
    }
    return this.type1.isSupertypeOf(other) || this.type2.isSupertypeOf(other);
  }

  override display() {
    return `${this.type1.display()}|${this.type2.display()}`;
  }

  override defaultFormInputCode() {
    return this.type1.defaultFormInputCode();
  }

  override defaultFormInputType() {
    // TODO - is this ok? what if the first type is a checkbox and the second requries a text input?
    return this.type1.defaultFormInputType();
  }
}

export function tOr<T1, T2>(type1: Type<T1>, type2: Type<T2>) {
  return new TOr(type1, type2);
}
