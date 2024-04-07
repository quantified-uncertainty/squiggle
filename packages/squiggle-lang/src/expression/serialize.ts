import { Value } from "../value/index.js";
import { SerializationStorage } from "../value/serialize.js";
import {
  Expression,
  ExpressionByKind,
  LambdaExpressionParameter,
} from "./index.js";

/**
 * TODO:
 * - Array
 * - Dict
 * */

type SerializedLambdaExpressionParameter = Omit<
  LambdaExpressionParameter,
  "annotation"
> & {
  annotation?: SerializedExpression;
};

type SerializedExpressionByKindGeneric<
  K extends Expression["kind"],
  ReplaceValue,
> = Omit<ExpressionByKind<K>, "value"> & {
  value: ReplaceValue;
};

type SerializedExpressionByKindObjectLike<
  K extends Expression["kind"],
  SkipFields extends keyof ExpressionByKind<K>["value"],
  ReplaceFields,
> = Omit<ExpressionByKind<K>, "value"> & {
  value: Omit<ExpressionByKind<K>["value"], SkipFields> & ReplaceFields;
};

export type SerializedExpression =
  | Exclude<
      Expression,
      {
        kind:
          | "Value"
          | "Program"
          | "Block"
          | "Ternary"
          | "Assign"
          | "Call"
          | "Lambda"
          | "Array"
          | "Dict";
      }
    >
  | SerializedExpressionByKindGeneric<"Value", number>
  | SerializedExpressionByKindGeneric<"Block", SerializedExpression[]>
  | SerializedExpressionByKindObjectLike<
      "Program",
      "statements",
      {
        statements: SerializedExpression[];
      }
    >
  | SerializedExpressionByKindObjectLike<
      "Ternary",
      "condition" | "ifTrue" | "ifFalse",
      {
        condition: SerializedExpression;
        ifTrue: SerializedExpression;
        ifFalse: SerializedExpression;
      }
    >
  | SerializedExpressionByKindObjectLike<
      "Assign",
      "right",
      {
        right: SerializedExpression;
      }
    >
  | SerializedExpressionByKindObjectLike<
      "Call",
      "fn" | "args",
      {
        fn: SerializedExpression;
        args: SerializedExpression[];
      }
    >
  | SerializedExpressionByKindObjectLike<
      "Lambda",
      "parameters" | "body",
      {
        parameters: SerializedLambdaExpressionParameter[];
        body: SerializedExpression;
      }
    >
  | SerializedExpressionByKindGeneric<"Array", SerializedExpression[]>
  | SerializedExpressionByKindGeneric<
      "Dict",
      [SerializedExpression, SerializedExpression][]
    >;

export function serializeExpression(
  expression: Expression,
  storage: SerializationStorage
): SerializedExpression {
  switch (expression.kind) {
    case "Value":
      return {
        ...expression,
        value: storage.serializeValue(expression.value),
      };
    case "Program":
      return {
        ...expression,
        value: {
          ...expression.value,
          statements: expression.value.statements.map((statement) =>
            serializeExpression(statement, storage)
          ),
        },
      };
    case "Block":
      return {
        ...expression,
        value: expression.value.map((statement) =>
          serializeExpression(statement, storage)
        ),
      };
    case "Ternary":
      return {
        ...expression,
        value: {
          ...expression.value,
          condition: serializeExpression(expression.value.condition, storage),
          ifTrue: serializeExpression(expression.value.ifTrue, storage),
          ifFalse: serializeExpression(expression.value.ifFalse, storage),
        },
      };
    case "Assign":
      return {
        ...expression,
        value: {
          ...expression.value,
          right: serializeExpression(expression.value.right, storage),
        },
      };

    case "Call":
      return {
        ...expression,
        value: {
          ...expression.value,
          fn: serializeExpression(expression.value.fn, storage),
          args: expression.value.args.map((arg) =>
            serializeExpression(arg, storage)
          ),
        },
      };
    case "Lambda":
      return {
        ...expression,
        value: {
          ...expression.value,
          parameters: expression.value.parameters.map((parameter) => ({
            ...parameter,
            annotation: parameter.annotation
              ? serializeExpression(parameter.annotation, storage)
              : undefined,
          })),
          body: serializeExpression(expression.value.body, storage),
        },
      };
    case "Array":
      return {
        ...expression,
        value: expression.value.map((value) =>
          serializeExpression(value, storage)
        ),
      };
    case "Dict":
      return {
        ...expression,
        value: expression.value.map(
          ([key, value]) =>
            [
              serializeExpression(key, storage),
              serializeExpression(value, storage),
            ] as [SerializedExpression, SerializedExpression]
        ),
      };
    default:
      return expression;
  }
}

export function deserializeExpression(
  expression: SerializedExpression,
  load: (id: number) => Value
): Expression {
  switch (expression.kind) {
    case "Value":
      return {
        ...expression,
        value: load(expression.value),
      };
    case "Program":
      return {
        ...expression,
        value: {
          ...expression.value,
          statements: expression.value.statements.map((statement) =>
            deserializeExpression(statement, load)
          ),
        },
      };

    case "Block":
      return {
        ...expression,
        value: expression.value.map((statement) =>
          deserializeExpression(statement, load)
        ),
      };
    case "Ternary":
      return {
        ...expression,
        value: {
          ...expression.value,
          condition: deserializeExpression(expression.value.condition, load),
          ifTrue: deserializeExpression(expression.value.ifTrue, load),
          ifFalse: deserializeExpression(expression.value.ifFalse, load),
        },
      };
    case "Assign":
      return {
        ...expression,
        value: {
          ...expression.value,
          right: deserializeExpression(expression.value.right, load),
        },
      };
    case "Call":
      return {
        ...expression,
        value: {
          ...expression.value,
          fn: deserializeExpression(expression.value.fn, load),
          args: expression.value.args.map((arg) =>
            deserializeExpression(arg, load)
          ),
        },
      };
    case "Lambda":
      return {
        ...expression,
        value: {
          ...expression.value,
          parameters: expression.value.parameters.map((parameter) => ({
            ...parameter,
            annotation: parameter.annotation
              ? deserializeExpression(parameter.annotation, load)
              : undefined,
          })),
          body: deserializeExpression(expression.value.body, load),
        },
      };
    case "Array":
      return {
        ...expression,
        value: expression.value.map((value) =>
          deserializeExpression(value, load)
        ),
      };
    case "Dict":
      return {
        ...expression,
        value: expression.value.map(
          ([key, value]) =>
            [
              deserializeExpression(key, load),
              deserializeExpression(value, load),
            ] as [Expression, Expression]
        ),
      };
    default:
      return expression;
  }
}
