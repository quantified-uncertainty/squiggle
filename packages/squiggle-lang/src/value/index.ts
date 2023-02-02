import { BaseDist } from "../dist/BaseDist";
import { Expression } from "../expression";
import { Namespace } from "../reducer/bindings";
import { ReducerContext } from "../reducer/Context";
import { declarationToString, LambdaDeclaration } from "../reducer/declaration";
import { Lambda } from "../reducer/lambda";
import * as DateTime from "../utility/DateTime";

// TODO - move these types to reducer/
export type ReducerFn = (
  expression: Expression,
  context: ReducerContext
) => [Value, ReducerContext];

export type ValueMap = Namespace;

/*
Value classes are shaped in a similar way and can work as discriminated unions thank to the `type` property.

`type` property is currently stored on instances; that creates some memory overhead, but it's hard to store it in prototype in a type-safe way.

Also, it's important that `type` is declared "as const"; otherwise unions won't work properly.

If you add a new value class, don't forget to add it to the "Value" union type below.

"vBlah" functions are just for the sake of brevity, so that we don't have to prefix any value creation with "new".
*/

class VArray {
  readonly type = "Array" as const;
  constructor(public value: Value[]) {}
  toString(): string {
    return "[" + this.value.map((v) => v.toString()).join(",") + "]";
  }
}
export const vArray = (v: Value[]) => new VArray(v);

class VBool {
  readonly type = "Bool" as const;
  constructor(public value: boolean) {}
  toString() {
    return String(this.value);
  }
}
export const vBool = (v: boolean) => new VBool(v);

class VDate {
  readonly type = "Date" as const;
  constructor(public value: Date) {}
  toString() {
    return DateTime.Date.toString(this.value);
  }
}
export const vDate = (v: Date) => new VDate(v);

class VDeclaration {
  readonly type = "Declaration" as const;
  constructor(public value: LambdaDeclaration) {}
  toString() {
    return declarationToString(this.value, (f) => vLambda(f).toString());
  }
}
export const vLambdaDeclaration = (v: LambdaDeclaration) => new VDeclaration(v);

class VDist {
  readonly type = "Dist" as const;
  constructor(public value: BaseDist) {}
  toString() {
    return this.value.toString();
  }
}
export const vDist = (v: BaseDist) => new VDist(v);

class VLambda {
  type = "Lambda" as const;
  constructor(public value: Lambda) {}
  toString() {
    return this.value.toString();
  }
}
export const vLambda = (v: Lambda) => new VLambda(v);

class VNumber {
  readonly type = "Number" as const;
  constructor(public value: number) {}
  toString() {
    return String(this.value);
  }
}
export const vNumber = (v: number) => new VNumber(v);

class VString {
  readonly type = "String" as const;
  constructor(public value: string) {}
  toString() {
    return `'${this.value}'`;
  }
}
export const vString = (v: string) => new VString(v);

class VRecord {
  readonly type = "Record" as const;
  constructor(public value: ValueMap) {}
  toString(): string {
    return (
      "{" +
      [...this.value.entries()]
        .map(([k, v]) => `${k}: ${v.toString()}`)
        .join(",") +
      "}"
    );
  }
}
export const vRecord = (v: ValueMap) => new VRecord(v);

class VTimeDuration {
  readonly type = "TimeDuration" as const;
  constructor(public value: number) {}
  toString() {
    return DateTime.Duration.toString(this.value);
  }
}
export const vTimeDuration = (v: number) => new VTimeDuration(v);

class VVoid {
  readonly type = "Void" as const;
  toString() {
    return "()";
  }
}
export const vVoid = () => new VVoid();

export type LabeledDistribution = {
  name: string;
  distribution: BaseDist;
};

export type Plot = {
  distributions: LabeledDistribution[];
};

class VPlot {
  readonly type = "Plot" as const;
  constructor(public value: Plot) {}
  toString() {
    return `Plot containing ${this.value.distributions
      .map((x) => x.name)
      .join(", ")}`;
  }
}

export const vPlot = (plot: Plot) => new VPlot(plot);

export type Value =
  | VArray
  | VBool
  | VDate
  | VDeclaration
  | VDist
  | VLambda
  | VNumber
  | VString
  | VRecord
  | VTimeDuration
  | VPlot
  | VVoid;
