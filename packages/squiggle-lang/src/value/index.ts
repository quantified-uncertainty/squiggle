import isInteger from "lodash/isInteger.js";
import { BaseDist } from "../dist/BaseDist.js";
import {
  REArrayIndexNotFound,
  REDictPropertyNotFound,
  REOther,
} from "../errors/messages.js";
import { Lambda } from "../reducer/lambda.js";
import * as DateTime from "../utility/DateTime.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { Domain } from "./domain.js";
import { shuffle } from "../utility/E_A.js";
import lodashIsEqual from "lodash/isEqual.js";

export type ValueMap = ImmutableMap<string, Value>;

// Mixin for values that allow field lookups; just for type safety.
type Indexable = {
  get(key: Value): Value;
};

abstract class BaseValue {
  abstract type: string;
  abstract publicName: string;

  clone() {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
  }

  abstract toString(): string;
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
  readonly publicName = "List";

  constructor(public value: Value[]) {
    super();
  }
  toString(): string {
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

  flatten() {
    return new VArray(
      this.value.reduce(
        (acc: Value[], v) =>
          acc.concat(v.type === "Array" ? v.value : ([v] as Value[])),
        []
      )
    );
  }

  shuffle() {
    return new VArray(shuffle(this.value));
  }

  isEqual(other: VArray) {
    if (this.value.length !== other.value.length) {
      return false;
    }

    for (let i = 0; i < this.value.length; i++) {
      isEqual(this.value[i], other.value[i]);
    }
    return true;
  }
}
export const vArray = (v: Value[]) => new VArray(v);

class VBool extends BaseValue {
  readonly type = "Bool";
  readonly publicName = "Boolean";

  constructor(public value: boolean) {
    super();
  }
  toString() {
    return String(this.value);
  }
  isEqual(other: VBool) {
    return this.value === other.value;
  }
}
export const vBool = (v: boolean) => new VBool(v);

class VDate extends BaseValue {
  readonly type = "Date";
  readonly publicName = "Date";

  constructor(public value: Date) {
    super();
  }
  toString() {
    return DateTime.Date.toString(this.value);
  }
  isEqual(other: VDate) {
    return this.value === other.value;
  }
}
export const vDate = (v: Date) => new VDate(v);

class VDist extends BaseValue {
  readonly type = "Dist";
  readonly publicName = "Distribution";

  constructor(public value: BaseDist) {
    super();
  }
  toString() {
    return this.value.toString();
  }
  isEqual(other: VDist) {
    return this.value.isEqual(other.value);
  }
}
export const vDist = (v: BaseDist) => new VDist(v);

class VLambda extends BaseValue implements Indexable {
  readonly type = "Lambda";
  readonly publicName = "Function";

  constructor(public value: Lambda) {
    super();
  }
  toString() {
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

class VNumber extends BaseValue {
  readonly type = "Number";
  readonly publicName = "Number";

  constructor(public value: number) {
    super();
  }
  toString() {
    return String(this.value);
  }
  isEqual(other: VNumber) {
    return this.value === other.value;
  }
}
export const vNumber = (v: number) => new VNumber(v);

class VString extends BaseValue {
  readonly type = "String";
  readonly publicName = "String";

  constructor(public value: string) {
    super();
  }
  toString() {
    return JSON.stringify(this.value);
  }
  isEqual(other: VString) {
    return this.value === other.value;
  }
}
export const vString = (v: string) => new VString(v);

class VDict extends BaseValue implements Indexable {
  readonly type = "Dict";
  readonly publicName = "Dictionary";

  constructor(public value: ValueMap) {
    super();
  }
  toString(): string {
    return (
      "{" +
      [...this.value.entries()]
        .map(([k, v]) => `${k}: ${v.toString()}`)
        .join(",") +
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

class VTimeDuration extends BaseValue {
  readonly type = "TimeDuration";
  readonly publicName = "Time Duration";

  constructor(public value: number) {
    super();
  }
  toString() {
    return DateTime.Duration.toString(this.value);
  }
  isEqual(other: VTimeDuration) {
    return this.value === other.value;
  }
}
export const vTimeDuration = (v: number) => new VTimeDuration(v);

export type CommonScaleArgs = {
  min?: number;
  max?: number;
  tickFormat?: string;
  title?: string;
};

export type Scale = CommonScaleArgs &
  (
    | {
        type: "linear";
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
      }
  );

function scaleIsEqual(valueA: Scale, valueB: Scale) {
  if (
    valueA.type !== valueB.type ||
    valueA.min !== valueB.min ||
    valueA.max !== valueB.max ||
    valueA.tickFormat !== valueB.tickFormat
  ) {
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

export const SCALE_SYMLOG_DEFAULT_CONSTANT = 0.0001;
export const SCALE_POWER_DEFAULT_CONSTANT = 0.1;

class VScale extends BaseValue {
  readonly type = "Scale";
  readonly publicName = "Scale";

  constructor(public value: Scale) {
    super();
  }

  toString(): string {
    switch (this.value.type) {
      case "linear":
        return "Linear scale"; // TODO - mix in min/max if specified
      case "log":
        return "Logarithmic scale";
      case "symlog":
        return `Symlog scale ({constant: ${
          this.value.constant || SCALE_SYMLOG_DEFAULT_CONSTANT
        }})`;
      case "power":
        return `Power scale ({exponent: ${
          this.value.exponent || SCALE_POWER_DEFAULT_CONSTANT
        }})`;
    }
  }

  isEqual(other: VScale) {
    return scaleIsEqual(this.value, other.value);
  }
}

export const vScale = (scale: Scale) => new VScale(scale);

export type CommonInputArgs = {
  name: string;
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
        options: string[];
      }
  );

class VInput extends BaseValue {
  readonly type = "Input";
  readonly publicName = "Input";

  constructor(public value: Input) {
    super();
  }

  toString(): string {
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
        distributions: LabeledDistribution[];
        xScale: Scale;
        yScale: Scale;
        showSummary: boolean;
      }
    | {
        type: "numericFn";
        fn: Lambda;
        xScale: Scale;
        yScale: Scale;
        points?: number;
      }
    | {
        type: "distFn";
        fn: Lambda;
        xScale: Scale;
        yScale: Scale;
        distXScale: Scale;
        points?: number;
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
        ids: string[];
      }
  );

export type TableChart = {
  data: Value[];
  title?: string;
  columns: { fn: Lambda; name: string | undefined }[];
};
class VTableChart extends BaseValue {
  readonly type = "TableChart";
  readonly publicName = "Table Chart";

  constructor(public value: TableChart) {
    super();
  }
  toString() {
    return `Table with ${this.value.columns.length}x${this.value.data.length} elements`;
  }
}

export const vTableChart = (v: TableChart) => new VTableChart(v);

export type Calculator = {
  fn: Lambda;
  inputs: Input[];
  autorun: boolean;
  description?: string;
  title?: string;
  sampleCount?: number;
};

class VCalculator extends BaseValue {
  readonly type = "Calculator";
  readonly publicName = "Calculator";

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

  toString() {
    return `Calculator`;
  }
}

export const vCalculator = (v: Calculator) => new VCalculator(v);

class VPlot extends BaseValue implements Indexable {
  readonly type = "Plot";
  readonly publicName = "Plot";

  constructor(public value: Plot) {
    super();
  }

  toString(): string {
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

export class VDomain extends BaseValue implements Indexable {
  readonly type = "Domain";
  readonly publicName = "Domain";

  constructor(public value: Domain) {
    super();
  }

  toString(): string {
    return this.value.toString();
  }

  get(key: Value) {
    if (key.type === "String" && this.value.type === "NumericRange") {
      if (key.value === "min") {
        return vNumber(this.value.min);
      }
      if (key.value === "max") {
        return vNumber(this.value.max);
      }
    }

    throw new REOther("Trying to access non-existent field");
  }

  isEqual(other: VDomain) {
    return this.value.isEqual(other.value);
  }
}

export const vDomain = (domain: Domain) => new VDomain(domain);

class VVoid extends BaseValue {
  readonly type = "Void";
  readonly publicName = "Void";

  constructor() {
    super();
  }
  toString() {
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
  | VTimeDuration
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
    case "TimeDuration":
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

export function uniq(array: Value[]): Value[] {
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

export function uniqBy(array: Value[], fn: (e: Value) => Value): Value[] {
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
