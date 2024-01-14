import lodashIsEqual from "lodash/isEqual.js";
import isInteger from "lodash/isInteger.js";

import { BaseDist } from "../dist/BaseDist.js";
import {
  REArrayIndexNotFound,
  REDictPropertyNotFound,
  REOther,
} from "../errors/messages.js";
import { Lambda } from "../reducer/lambda.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { SDate } from "../utility/SDate.js";
import { SDuration } from "../utility/SDuration.js";
import { DateRangeDomain, Domain, NumericRangeDomain } from "./domain.js";
import { ValueTags, ValueTagsType } from "./valueTags.js";

export type ValueMap = ImmutableMap<string, Value>;

// Mixin for values that allow field lookups; just for type safety.
type Indexable = {
  get(key: Value): Value;
};

abstract class BaseValue {
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

  abstract valueToString(): string;

  toString() {
    const valueString = this.valueToString();
    if (!this.tags) {
      return valueString;
    }
    const argsStr = `{${this.tags.toString()}}`;
    if (argsStr !== "") {
      return `${valueString}, with tags ${argsStr}`;
    } else {
      return valueString;
    }
  }
}

/*
Value classes are shaped in a similar way and can work as discriminated unions thank to the `type` property.

`type` property is currently stored on instances; that creates some memory overhead, but it's hard to store it in prototype in a type-safe way.

Also, it's important that `type` is declared as readonly (or `as const`, but readonly is enough); otherwise unions won't work properly.

If you add a new value class, don't forget to add it to the "Value" union type below.

"vBlah" functions are just for the sake of brevity, so that we don't have to prefix any value creation with "new".
*/

class VArray extends BaseValue implements Indexable {
  readonly type = "Array";

  override get publicName() {
    return "List";
  }

  constructor(public value: readonly Value[]) {
    super();
  }
  valueToString() {
    return "[" + this.value.map((v) => v.toString()).join(",") + "]";
  }

  get(key: Value) {
    if (key.type === "Number") {
      if (!isInteger(key.value)) {
        throw new REArrayIndexNotFound(
          "Array index must be an integer",
          key.value
        );
      }
      const index = key.value | 0;
      if (index >= 0 && index < this.value.length) {
        return this.value[index];
      } else {
        throw new REArrayIndexNotFound("Array index not found", index);
      }
    }

    throw new REOther("Can't access non-numerical key on an array");
  }

  isEqual(other: VArray) {
    if (this.value.length !== other.value.length) {
      return false;
    }

    for (let i = 0; i < this.value.length; i++) {
      const _isEqual = isEqual(this.value[i], other.value[i]);
      if (!_isEqual) {
        return false;
      }
    }
    return true;
  }
}
export const vArray = (v: readonly Value[]) => new VArray(v);

class VBool extends BaseValue {
  readonly type = "Bool";

  override get publicName() {
    return "Boolean";
  }

  constructor(public value: boolean) {
    super();
  }
  valueToString() {
    return String(this.value);
  }
  isEqual(other: VBool) {
    return this.value === other.value;
  }
}
export const vBool = (v: boolean) => new VBool(v);

export class VDate extends BaseValue {
  readonly type = "Date";

  constructor(public value: SDate) {
    super();
  }
  valueToString() {
    return this.value.toString();
  }
  isEqual(other: VDate) {
    return this.value.isEqual(other.value);
  }
}
export const vDate = (v: SDate) => new VDate(v);

class VDist extends BaseValue {
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
}
export const vDist = (v: BaseDist) => new VDist(v);

class VLambda extends BaseValue implements Indexable {
  readonly type = "Lambda";

  override get publicName() {
    return "Function";
  }

  constructor(public value: Lambda) {
    super();
  }
  valueToString() {
    return this.value.toString();
  }

  get(key: Value) {
    if (key.type === "String" && key.value === "parameters") {
      switch (this.value.type) {
        case "UserDefinedLambda":
          return vArray(
            this.value.parameters.map((parameter) => {
              const fields: [string, Value][] = [
                ["name", vString(parameter.name)],
              ];
              if (parameter.domain) {
                fields.push(["domain", parameter.domain]);
              }
              return vDict(ImmutableMap(fields));
            })
          );
        case "BuiltinLambda":
          throw new REOther("Can't access parameters on built in functions");
      }
    }
    throw new REOther("No such field");
  }
}
export const vLambda = (v: Lambda) => new VLambda(v);

export class VNumber extends BaseValue {
  readonly type = "Number";

  constructor(public value: number) {
    super();
  }
  valueToString() {
    return String(this.value);
  }
  isEqual(other: VNumber) {
    return this.value === other.value;
  }
}
export const vNumber = (v: number) => new VNumber(v);

class VString extends BaseValue {
  readonly type = "String";

  constructor(public value: string) {
    super();
  }
  valueToString() {
    return JSON.stringify(this.value);
  }
  isEqual(other: VString) {
    return this.value === other.value;
  }
}
export const vString = (v: string) => new VString(v);

export class VDict extends BaseValue implements Indexable {
  readonly type = "Dict";

  override get publicName() {
    return "Dictionary";
  }

  constructor(public value: ValueMap) {
    super();
  }

  static empty() {
    return new VDict(ImmutableMap([]));
  }

  merge(other: VDict) {
    return new VDict(this.value.merge(other.value));
  }

  valueToString() {
    return (
      "{" +
      [...this.value.entries()]
        .map(([k, v]) => `${k}: ${v.toString()}`)
        .join(", ") +
      "}"
    );
  }

  get(key: Value) {
    if (key.type === "String") {
      const result = this.value.get(key.value);
      if (!result) {
        throw new REDictPropertyNotFound("Dict property not found", key.value);
      }
      return result;
    } else {
      throw new REOther("Can't access non-string key on a dict");
    }
  }

  isEqual(other: VDict): boolean {
    if (this.value.size !== other.value.size) {
      return false;
    }

    for (const [key, valueA] of this.value.entries()) {
      const valueB = other.value.get(key);

      // Check if key exists in the other dictionary
      if (!valueB) {
        return false;
      }

      // Compare the values associated with the key
      if (!isEqual(valueA, valueB)) {
        return false;
      }
    }

    return true;
  }
}
export const vDict = (v: ValueMap) => new VDict(v);

class VDuration extends BaseValue {
  readonly type = "Duration";

  override get publicName() {
    return "Time Duration";
  }

  constructor(public value: SDuration) {
    super();
  }

  valueToString() {
    return this.value.toString();
  }
  isEqual(other: VDuration) {
    return this.value.toMs() === other.value.toMs();
  }
}
export const vDuration = (v: SDuration) => new VDuration(v);

export type ScaleMethod =
  | {
      type: "linear";
    }
  | {
      type: "date";
    }
  | {
      type: "log";
    }
  | {
      type: "symlog";
      constant?: number;
    }
  | {
      type: "power";
      exponent?: number;
    };

export function methodWithDefaultParams(shift: ScaleMethod) {
  switch (shift.type) {
    case "symlog":
      return {
        ...shift,
        constant: shift.constant ?? SCALE_SYMLOG_DEFAULT_CONSTANT,
      };
    case "power":
      return {
        ...shift,
        exponent: shift.exponent ?? SCALE_POWER_DEFAULT_CONSTANT,
      };
    default:
      return shift;
  }
}

export type Scale = {
  method?: ScaleMethod;
  min?: number;
  max?: number;
  tickFormat?: string;
  title?: string;
};

function methodIsEqual(valueA: ScaleMethod, valueB: ScaleMethod) {
  if (valueA.type !== valueB.type) {
    return false;
  }
  switch (valueA.type) {
    case "symlog":
      return (
        (valueA as { constant?: number }).constant ===
        (valueB as { constant?: number }).constant
      );
    case "power":
      return (
        (valueA as { exponent?: number }).exponent ===
        (valueB as { exponent?: number }).exponent
      );
    default:
      return true;
  }
}

function scaleIsEqual(valueA: Scale, valueB: Scale) {
  if (
    valueA.method?.type !== valueB.method?.type ||
    valueA.min !== valueB.min ||
    valueA.max !== valueB.max ||
    valueA.tickFormat !== valueB.tickFormat
  ) {
    return false;
  }
  if (valueA.method && valueB.method) {
    return methodIsEqual(valueA.method, valueB.method);
  }
  return true;
}

export const SCALE_SYMLOG_DEFAULT_CONSTANT = 0.0001;
export const SCALE_POWER_DEFAULT_CONSTANT = 0.1;

class VScale extends BaseValue {
  readonly type = "Scale";

  constructor(public value: Scale) {
    super();
  }

  valueToString(): string {
    switch (this.value.method?.type) {
      case "linear":
        return "Linear scale"; // TODO - mix in min/max if specified
      case "log":
        return "Logarithmic scale";
      case "symlog":
        return `Symlog scale ({constant: ${
          this.value.method.constant || SCALE_SYMLOG_DEFAULT_CONSTANT
        }})`;
      case "power":
        return `Power scale ({exponent: ${
          this.value.method.exponent || SCALE_POWER_DEFAULT_CONSTANT
        }})`;
      case "date":
        return "Date scale";
      default:
        return "Unspecified scale";
    }
  }

  isEqual(other: VScale) {
    return scaleIsEqual(this.value, other.value);
  }
}

export const vScale = (scale: Scale) => new VScale(scale);

export type CommonInputArgs = {
  name: string;
  typeName?: string;
  description?: string;
};

export type Input = CommonInputArgs &
  (
    | {
        type: "text";
        default?: string;
      }
    | {
        type: "textArea";
        default?: string;
      }
    | {
        type: "checkbox";
        default?: boolean;
      }
    | {
        type: "select";
        default?: string;
        options: readonly string[];
      }
  );

export type InputType = "text" | "textArea" | "checkbox" | "select";
class VInput extends BaseValue {
  readonly type = "Input";

  constructor(public value: Input) {
    super();
  }

  valueToString(): string {
    switch (this.value.type) {
      case "text":
        return "Text input";
      case "textArea":
        return "Text area input";
      case "checkbox":
        return "Check box input";
      case "select":
        return `Select input (${this.value.options.join(", ")})`;
    }
  }

  isEqual(other: VInput) {
    return lodashIsEqual(this.value, other.value);
  }
}

export const vInput = (input: Input) => new VInput(input);

export type LabeledDistribution = {
  name?: string;
  distribution: BaseDist;
};

export type CommonPlotArgs = {
  title?: string;
};

export type Plot = CommonPlotArgs &
  (
    | {
        type: "distributions";
        distributions: readonly LabeledDistribution[];
        xScale: Scale;
        yScale: Scale;
        showSummary: boolean;
      }
    | {
        type: "numericFn";
        fn: Lambda;
        xScale: Scale;
        yScale: Scale;
        xPoints?: number[];
      }
    | {
        type: "distFn";
        fn: Lambda;
        xScale: Scale;
        yScale: Scale;
        distXScale: Scale;
        xPoints?: number[];
      }
    | {
        type: "scatter";
        xDist: BaseDist;
        yDist: BaseDist;
        xScale: Scale;
        yScale: Scale;
      }
    | {
        type: "relativeValues";
        fn: Lambda;
        ids: readonly string[];
      }
  );

export type TableChart = {
  data: readonly Value[];
  columns: readonly { fn: Lambda; name: string | undefined }[];
};
class VTableChart extends BaseValue {
  readonly type = "TableChart";

  override get publicName() {
    return "Table Chart";
  }

  constructor(public value: TableChart) {
    super();
  }
  valueToString() {
    return `Table with ${this.value.columns.length}x${this.value.data.length} elements`;
  }
}

export const vTableChart = (v: TableChart) => new VTableChart(v);

export type Calculator = {
  fn: Lambda;
  inputs: readonly Input[];
  autorun: boolean;
  description?: string;
  title?: string;
  sampleCount?: number;
};

class VCalculator extends BaseValue {
  readonly type = "Calculator";

  private error: REOther | null = null;

  constructor(public value: Calculator) {
    super();
    if (!value.fn.parameterCounts().includes(value.inputs.length)) {
      this.setError(
        `Calculator function needs ${value.fn.parameterCountString()} parameters, but ${
          value.inputs.length
        } fields were provided.`
      );
    }

    if (value.inputs.some((x) => x.name === "")) {
      this.setError(`Calculator field names can't be empty.`);
    }

    const fieldNames = value.inputs.map((f) => f.name);
    const uniqueNames = new Set(fieldNames);
    if (fieldNames.length !== uniqueNames.size) {
      this.setError(`Duplicate calculator field names found.`);
    }
  }

  private setError(message: string): void {
    this.error = new REOther(message);
  }

  getError(): REOther | null {
    return this.error;
  }

  valueToString() {
    return `Calculator`;
  }
}

export const vCalculator = (v: Calculator) => new VCalculator(v);

class VPlot extends BaseValue implements Indexable {
  readonly type = "Plot";

  constructor(public value: Plot) {
    super();
  }

  valueToString(): string {
    switch (this.value.type) {
      case "distributions":
        return `Plot containing ${this.value.distributions
          .map((x) => x.name)
          .join(", ")}`;
      case "numericFn":
        return `Plot for numeric function ${this.value.fn}`;
      case "distFn":
        return `Plot for dist function ${this.value.fn}`;
      case "scatter":
        return `Scatter plot for distributions ${this.value.xDist} and ${this.value.yDist}`;
      case "relativeValues":
        return `Plot for relative values ${this.value.ids.join(", ")}`;
    }
  }

  get(key: Value) {
    if (
      key.type === "String" &&
      key.value === "fn" &&
      (this.value.type === "numericFn" ||
        this.value.type === "distFn" ||
        this.value.type === "relativeValues")
    ) {
      return vLambda(this.value.fn);
    }

    throw new REOther("Trying to access non-existent field");
  }
}

export const vPlot = (plot: Plot) => new VPlot(plot);

function domainIsEqual(valueA: Domain, valueB: Domain) {
  if (valueA.type !== valueB.type) {
    return false;
  }
  switch (valueA.type) {
    case "DateRange":
      return (valueA as DateRangeDomain).isEqual(valueB as DateRangeDomain);
    case "NumericRange":
      return (valueA as NumericRangeDomain).isEqual(
        valueB as NumericRangeDomain
      );
    default:
      return false;
  }
}

export class VDomain extends BaseValue implements Indexable {
  readonly type = "Domain";

  constructor(public value: Domain) {
    super();
  }

  valueToString(): string {
    return this.value.toString();
  }

  get domainType(): "NumericRange" | "DateRange" {
    return this.value.type;
  }

  get(key: Value): VNumber | VDate {
    const mapValue = (value: number | SDate) =>
      typeof value === "number" ? vNumber(value) : vDate(value);

    if (key.type === "String") {
      if (key.value === "min") {
        return mapValue(this.value.min);
      }
      if (key.value === "max") {
        return mapValue(this.value.max);
      }
    }

    throw new REOther("Trying to access non-existent field");
  }

  isEqual(other: VDomain) {
    return domainIsEqual(this.value, other.value);
  }
}

export const vDomain = (domain: Domain) => new VDomain(domain);

class VVoid extends BaseValue {
  readonly type = "Void";

  constructor() {
    super();
  }
  valueToString() {
    return "()";
  }
}
export const vVoid = () => new VVoid();

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
