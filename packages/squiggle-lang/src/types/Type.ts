import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { type Value } from "../value/index.js";
import { type InputType } from "../value/VInput.js";
import { SerializedType } from "./serialize.js";

export abstract class Type<T = unknown> {
  // Check if the given value is of this type.
  abstract check(v: Value): boolean;

  // These two methods are useful for builtin functions, because we implement
  // them in terms of unpacked values (native JS types, `number`, `string` and
  // so on), not in term of `Value` objects.
  //
  // Technically, these methods don't belong in the `Type` class. It would be
  // better to do pack/unpack in another layer, specific to the function
  // registry. This could simplify our type hierarchy, by removing `TOr`,
  // `TDistOrNumber` and `TLambdaNand`.
  //
  // Fixing this would require a separate set of constructors for the input
  // parameters and output parameters in `FnDefinition`.
  abstract unpack(v: Value): T | undefined;
  abstract pack(v: T): Value;

  // Types must be serializable, because values are serializable, and Domain
  // values (`VDomain`) refer to types.
  abstract serialize(visit: SquiggleSerializationVisitor): SerializedType;

  abstract toString(): string;

  defaultFormInputCode() {
    return "";
  }

  defaultFormInputType(): InputType {
    return "text";
  }
}

export class TAny extends Type<Value> {
  constructor(public genericName?: string) {
    super();
  }

  check() {
    return true;
  }

  unpack(v: Value) {
    return v;
  }

  pack(v: Value) {
    return v;
  }

  toString() {
    return this.genericName ? `'${this.genericName}` : "any";
  }

  serialize(): SerializedType {
    return { kind: "Any", genericName: this.genericName };
  }
}

export function tAny(params?: { genericName?: string }) {
  return new TAny(params?.genericName);
}
