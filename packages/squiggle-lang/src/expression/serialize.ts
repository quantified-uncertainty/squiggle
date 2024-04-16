import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../serialization/squiggle.js";
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
  visit: SquiggleSerializationVisitor
): SerializedExpression {
  switch (expression.kind) {
    case "Value":
      return {
        ...expression,
        value: visit.value(expression.value),
      };
    case "Program":
      return {
        ...expression,
        value: {
          ...expression.value,
          statements: expression.value.statements.map((statement) =>
            serializeExpression(statement, visit)
          ),
        },
      };
    case "Block":
      return {
        ...expression,
        value: expression.value.map((statement) =>
          serializeExpression(statement, visit)
        ),
      };
    case "Ternary":
      return {
        ...expression,
        value: {
          ...expression.value,
          condition: serializeExpression(expression.value.condition, visit),
          ifTrue: serializeExpression(expression.value.ifTrue, visit),
          ifFalse: serializeExpression(expression.value.ifFalse, visit),
        },
      };
    case "Assign":
      return {
        ...expression,
        value: {
          ...expression.value,
          right: serializeExpression(expression.value.right, visit),
        },
      };

    case "Call":
      return {
        ...expression,
        value: {
          ...expression.value,
          fn: serializeExpression(expression.value.fn, visit),
          args: expression.value.args.map((arg) =>
            serializeExpression(arg, visit)
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
              ? serializeExpression(parameter.annotation, visit)
              : undefined,
          })),
          body: serializeExpression(expression.value.body, visit),
        },
      };
    case "Array":
      return {
        ...expression,
        value: expression.value.map((value) =>
          serializeExpression(value, visit)
        ),
      };
    case "Dict":
      return {
        ...expression,
        value: expression.value.map(
          ([key, value]) =>
            [
              serializeExpression(key, visit),
              serializeExpression(value, visit),
            ] as [SerializedExpression, SerializedExpression]
        ),
      };
    default:
      return expression;
  }
}

export function deserializeExpression(
  expression: SerializedExpression,
  visit: SquiggleDeserializationVisitor
): Expression {
  switch (expression.kind) {
    case "Value":
      return {
        ...expression,
        value: visit.value(expression.value),
      };
    case "Program":
      return {
        ...expression,
        value: {
          ...expression.value,
          statements: expression.value.statements.map((statement) =>
            deserializeExpression(statement, visit)
          ),
        },
      };

    case "Block":
      return {
        ...expression,
        value: expression.value.map((statement) =>
          deserializeExpression(statement, visit)
        ),
      };
    case "Ternary":
      return {
        ...expression,
        value: {
          ...expression.value,
          condition: deserializeExpression(expression.value.condition, visit),
          ifTrue: deserializeExpression(expression.value.ifTrue, visit),
          ifFalse: deserializeExpression(expression.value.ifFalse, visit),
        },
      };
    case "Assign":
      return {
        ...expression,
        value: {
          ...expression.value,
          right: deserializeExpression(expression.value.right, visit),
        },
      };
    case "Call":
      return {
        ...expression,
        value: {
          ...expression.value,
          fn: deserializeExpression(expression.value.fn, visit),
          args: expression.value.args.map((arg) =>
            deserializeExpression(arg, visit)
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
              ? deserializeExpression(parameter.annotation, visit)
              : undefined,
          })),
          body: deserializeExpression(expression.value.body, visit),
        },
      };
    case "Array":
      return {
        ...expression,
        value: expression.value.map((value) =>
          deserializeExpression(value, visit)
        ),
      };
    case "Dict":
      return {
        ...expression,
        value: expression.value.map(
          ([key, value]) =>
            [
              deserializeExpression(key, visit),
              deserializeExpression(value, visit),
            ] as [Expression, Expression]
        ),
      };
    default:
      return expression;
  }
}
