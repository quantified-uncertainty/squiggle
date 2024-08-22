import { Lambda } from "../reducer/lambda/index.js";
import { Value, vLambda } from "../value/index.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

// This type is a hack. It's used to create assert definitions that are used to guard against ambiguous function calls.
// TODO: analyze the definitions for ambiguity directly in `fnDefinition.ts` code.
export class TLambdaNand extends Type<Lambda> {
  constructor(public paramLengths: number[]) {
    super();
  }

  check(v: Value): boolean {
    return this.unpack(v) !== undefined;
  }

  unpack(v: Value) {
    const counts = v.type === "Lambda" && v.value.parameterCounts();
    return counts && this.paramLengths.every((p) => counts.includes(p))
      ? v.value
      : undefined;
  }

  pack(v: Lambda): Value {
    return vLambda(v);
  }

  serialize(): SerializedType {
    return {
      kind: "LambdaNand",
      paramLengths: this.paramLengths,
    };
  }

  toString(): string {
    return "LambdaNand";
  }
}

export function tLambdaNand(paramLengths: number[]) {
  return new TLambdaNand(paramLengths);
}
