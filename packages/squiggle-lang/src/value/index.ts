import { BaseDist } from "../Dist/BaseDist";
import { Expression } from "../expression";
import { ReducerContext } from "../reducer/Context";
import { declarationToString, LambdaDeclaration } from "../reducer/Declaration";
import { Lambda } from "../reducer/Lambda";
import * as DateTime from "../utility/DateTime";
import { ImmutableMap } from "../utility/immutableMap";

// TODO - move these types to reducer/
export type ReducerFn = (
  expression: Expression,
  context: ReducerContext
) => [Value, ReducerContext];

export type ValueMap = ImmutableMap<string, Value>;

type KV<T extends string, V> = Readonly<{ type: T; value: V }>;

export type Value =
  | KV<"Array", Value[]>
  | KV<"Bool", boolean>
  | KV<"Date", Date>
  | KV<"Declaration", LambdaDeclaration>
  | KV<"Dist", BaseDist>
  | KV<"Lambda", Lambda>
  | KV<"Number", number>
  | KV<"String", string>
  | KV<"Record", ValueMap>
  | KV<"TimeDuration", number>
  | { type: "Void" };

export const vBool = (value: boolean): Value => ({ type: "Bool", value });
export const vNumber = (value: number): Value => ({ type: "Number", value });
export const vDuration = (value: number): Value => ({
  type: "TimeDuration",
  value,
});
export const vDate = (value: Date): Value => ({
  type: "Date",
  value,
});
export const vTimeDuration = (value: number): Value => ({
  type: "TimeDuration",
  value,
});
export const vString = (value: string): Value => ({ type: "String", value });
export const vDist = (value: BaseDist): Value => ({ type: "Dist", value });
export const vVoid = (): Value => ({ type: "Void" });
export const vRecord = (r: ValueMap): Extract<Value, { type: "Record" }> => ({
  type: "Record",
  value: r,
});
export const vLambda = (v: Lambda): Value => ({ type: "Lambda", value: v });

export const vLambdaDeclaration = (value: LambdaDeclaration): Value => ({
  type: "Declaration",
  value,
});

export const vArray = (a: Value[]): Value => ({
  type: "Array",
  value: a,
});

export const valueMapToString = (v: ValueMap): string => {
  return (
    "{" +
    [...v.entries()].map(([k, v]) => `${k}: ${valueToString(v)}`).join(",") +
    "}"
  );
};

export const valueToString = (v: Value): string => {
  switch (v.type) {
    case "Array":
      return "[" + v.value.map(valueToString).join(",") + "]";
    case "Bool":
      return String(v.value);
    case "Date":
      return DateTime.Date.toString(v.value);
    case "Declaration":
      return declarationToString(v.value, (f) => valueToString(vLambda(f)));
    case "Dist":
      return v.value.toString();
    case "Lambda": {
      switch (v.value.type) {
        case "Lambda":
          return `lambda(${v.value.parameters.join(",")}=>internal code)`;
        case "Builtin":
          return "Builtin function";
        default:
          throw new Error("Unreachable");
      }
    }
    case "Number":
      return String(v.value);
    case "Record":
      return valueMapToString(v.value);
    case "String":
      return `'${v.value}'`;
    case "TimeDuration":
      return DateTime.Duration.toString(v.value);
    case "Void":
      return "()";
    default:
      throw new Error("Unreachable");
  }
};
