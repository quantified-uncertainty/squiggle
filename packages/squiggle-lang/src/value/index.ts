import { REOther } from "../errors/messages.js";
import { ValueTags, ValueTagsType } from "./valueTags.js";
// Specific value classes
import { VArray } from "./VArray.js";
import { VBool } from "./VBool.js";
import { VCalculator } from "./VCalculator.js";
import { VDate } from "./VDate.js";
import { VDict } from "./VDict.js";
import { VDist } from "./VDist.js";
import { VDomain } from "./VDomain.js";
import { VDuration } from "./VDuration.js";
import { VInput } from "./VInput.js";
import { VLambda } from "./vLambda.js";
import { VNumber } from "./VNumber.js";
import { VPlot } from "./VPlot.js";
import { VScale } from "./VScale.js";
import { VString } from "./VString.js";
import { VTableChart } from "./VTableChart.js";
import { VVoid } from "./VVoid.js";

// Barrel reexports for convenience
export { vArray } from "./VArray.js";
export { vBool } from "./VBool.js";
export { vCalculator } from "./VCalculator.js";
export { vDate } from "./VDate.js";
export { vDict } from "./VDict.js";
export { vDist } from "./VDist.js";
export { vDomain } from "./VDomain.js";
export { vDuration } from "./VDuration.js";
export { vInput } from "./VInput.js";
export { vLambda } from "./vLambda.js";
export { vNumber } from "./VNumber.js";
export { vPlot } from "./VPlot.js";
export { vScale } from "./VScale.js";
export { vString } from "./VString.js";
export { vTableChart } from "./VTableChart.js";
export { vVoid } from "./VVoid.js";

/*
Value classes are shaped in a similar way and can work as discriminated unions thank to the `type` property.

`type` property is currently stored on instances; that creates some memory overhead, but it's hard to store it in prototype in a type-safe way.

Also, it's important that `type` is declared as readonly (or `as const`, but readonly is enough); otherwise unions won't work properly.

If you add a new value class, don't forget to add it to the "Value" union type below.

"vBlah" functions are just for the sake of brevity, so that we don't have to prefix any value creation with "new".
*/
export abstract class BaseValue {
  abstract type: string;
  readonly tags: ValueTags | undefined;

  // This is a getter, not a field, for performance reasons.
  get publicName() {
    return this.type;
  }

  getTags() {
    return this.tags ?? new ValueTags({});
  }

  copyWithTags(tags: ValueTags) {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), {
      ...this,
      tags,
    });
  }

  mergeTags(args: ValueTagsType) {
    return this.copyWithTags(this.tags?.merge(args) ?? new ValueTags(args));
  }

  protected abstract valueToString(): string;

  toString() {
    const valueString = this.valueToString();
    if (!this.tags || this.tags.isEmpty()) {
      return valueString;
    }
    const argsStr = `{${this.tags.toString()}}`;
    return `${valueString}, with tags ${argsStr}`;
  }
}

export type Value =
  | VArray
  | VBool
  | VDate
  | VDist
  | VLambda
  | VNumber
  | VString
  | VDict
  | VDuration
  | VPlot
  | VTableChart
  | VCalculator
  | VScale
  | VInput
  | VDomain
  | VVoid;

export function isEqual(a: Value, b: Value): boolean {
  if (a.type !== b.type) {
    return false;
  }
  switch (a.type) {
    case "Bool":
    case "Number":
    case "String":
    case "Dist":
    case "Date":
    case "Duration":
    case "Scale":
    case "Domain":
    case "Array":
    case "Dict":
      return a.isEqual(b as any);
    case "Void":
      return true;
  }

  if (a.toString() !== b.toString()) {
    return false;
  }
  throw new REOther("Equal not implemented for these inputs");
}

const _isUniqableType = (t: Value) => "isEqual" in t;

export function uniq(array: readonly Value[]): Value[] {
  const uniqueArray: Value[] = [];

  for (const item of array) {
    if (!_isUniqableType(item)) {
      throw new REOther(`Can't apply uniq() to element with type ${item.type}`);
    }
    if (!uniqueArray.some((existingItem) => isEqual(existingItem, item))) {
      uniqueArray.push(item);
    }
  }

  return uniqueArray;
}

export function uniqBy(
  array: readonly Value[],
  fn: (e: Value) => Value
): Value[] {
  const seen: Value[] = [];
  const uniqueArray: Value[] = [];

  for (const item of array) {
    const computed = fn(item);
    if (!_isUniqableType(computed)) {
      throw new REOther(
        `Can't apply uniq() to element with type ${computed.type}`
      );
    }
    if (!seen.some((existingItem) => isEqual(existingItem, computed))) {
      seen.push(computed);
      uniqueArray.push(item);
    }
  }

  return uniqueArray;
}
