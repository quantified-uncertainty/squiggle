import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../serialization/squiggle.js";
import {
  Expression,
  ExpressionByKind,
  LambdaExpressionParameter,
} from "./index.js";

type SerializedLambdaExpressionParameter = Omit<
  LambdaExpressionParameter,
  "annotation"
> & {
  annotation?: number;
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
  | SerializedExpressionByKindGeneric<"Block", number[]>
  | SerializedExpressionByKindObjectLike<
      "Program",
      "statements",
      {
        statements: number[];
      }
    >
  | SerializedExpressionByKindObjectLike<
      "Ternary",
      "condition" | "ifTrue" | "ifFalse",
      {
        condition: number;
        ifTrue: number;
        ifFalse: number;
      }
    >
  | SerializedExpressionByKindObjectLike<
      "Assign",
      "right",
      {
        right: number;
      }
    >
  | SerializedExpressionByKindObjectLike<
      "Call",
      "fn" | "args",
      {
        fn: number;
        args: number[];
      }
    >
  | SerializedExpressionByKindObjectLike<
      "Lambda",
      "parameters" | "body",
      {
        parameters: SerializedLambdaExpressionParameter[];
        body: number;
      }
    >
  | SerializedExpressionByKindGeneric<"Array", number[]>
  | SerializedExpressionByKindGeneric<"Dict", [number, number][]>;

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
            visit.expression(statement)
          ),
        },
      };
    case "Block":
      return {
        ...expression,
        value: expression.value.map((statement) => visit.expression(statement)),
      };
    case "Ternary":
      return {
        ...expression,
        value: {
          ...expression.value,
          condition: visit.expression(expression.value.condition),
          ifTrue: visit.expression(expression.value.ifTrue),
          ifFalse: visit.expression(expression.value.ifFalse),
        },
      };
    case "Assign":
      return {
        ...expression,
        value: {
          ...expression.value,
          right: visit.expression(expression.value.right),
        },
      };

    case "Call":
      return {
        ...expression,
        value: {
          ...expression.value,
          fn: visit.expression(expression.value.fn),
          args: expression.value.args.map((arg) => visit.expression(arg)),
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
              ? visit.expression(parameter.annotation)
              : undefined,
          })),
          body: visit.expression(expression.value.body),
        },
      };
    case "Array":
      return {
        ...expression,
        value: expression.value.map((value) => visit.expression(value)),
      };
    case "Dict":
      return {
        ...expression,
        value: expression.value.map(
          ([key, value]) =>
            [visit.expression(key), visit.expression(value)] as [number, number]
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
            visit.expression(statement)
          ),
        },
      };

    case "Block":
      return {
        ...expression,
        value: expression.value.map((statement) => visit.expression(statement)),
      };
    case "Ternary":
      return {
        ...expression,
        value: {
          ...expression.value,
          condition: visit.expression(expression.value.condition),
          ifTrue: visit.expression(expression.value.ifTrue),
          ifFalse: visit.expression(expression.value.ifFalse),
        },
      };
    case "Assign":
      return {
        ...expression,
        value: {
          ...expression.value,
          right: visit.expression(expression.value.right),
        },
      };
    case "Call":
      return {
        ...expression,
        value: {
          ...expression.value,
          fn: visit.expression(expression.value.fn),
          args: expression.value.args.map((arg) => visit.expression(arg)),
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
              ? visit.expression(parameter.annotation)
              : undefined,
          })),
          body: visit.expression(expression.value.body),
        },
      };
    case "Array":
      return {
        ...expression,
        value: expression.value.map((value) => visit.expression(value)),
      };
    case "Dict":
      return {
        ...expression,
        value: expression.value.map(
          ([key, value]) =>
            [visit.expression(key), visit.expression(value)] as [
              Expression,
              Expression,
            ]
        ),
      };
    default:
      return expression;
  }
}
