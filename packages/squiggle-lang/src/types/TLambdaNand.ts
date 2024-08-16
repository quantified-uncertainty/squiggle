import { Lambda } from "../reducer/lambda/index.js";
import { Value, vLambda } from "../value/index.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

// This type is a hack. It's used to create assert definitions that are used to guard against ambiguous function calls.
// TODO: analyze the definitions for ambiguity directly in `fnDefinition.ts` code.
export class TLambdaNand extends Type<Lambda> {
  override isSupertypeOf(other: Type<unknown>): boolean {
    throw new Error("Method not implemented.");
  }
  override display(): string {
    throw new Error("Method not implemented.");
  }
  constructor(public paramLengths: number[]) {
    super();
  }

  override check(v: Value): boolean {
    return this.unpack(v) !== undefined;
  }

  override unpack(v: Value) {
    const counts = v.type === "Lambda" && v.value.parameterCounts();
    return counts && this.paramLengths.every((p) => counts.includes(p))
      ? v.value
      : undefined;
  }

  override pack(v: Lambda): Value {
    return vLambda(v);
  }

  override serialize(): SerializedType {
    return {
      kind: "LambdaNand",
      paramLengths: this.paramLengths,
    };
  }
}

export function tLambdaNand(paramLengths: number[]) {
  return new TLambdaNand(paramLengths);
}
