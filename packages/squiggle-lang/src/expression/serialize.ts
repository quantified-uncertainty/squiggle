import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../serialization/squiggle.js";
import {
  Expression,
  ExpressionContent,
  ExpressionContentByKind,
  LambdaExpressionParameter,
} from "./index.js";

type SerializedLambdaExpressionParameter = Omit<
  LambdaExpressionParameter,
  "annotation"
> & {
  annotation?: number;
};

type SerializedExpressionContentByKindGeneric<
  K extends ExpressionContent["kind"],
  ReplaceValue,
> = Omit<ExpressionContentByKind<K>, "value"> & {
  value: ReplaceValue;
};

type SerializedExpressionContentByKindObjectLike<
  K extends ExpressionContent["kind"],
  SkipFields extends keyof ExpressionContentByKind<K>["value"],
  ReplaceFields,
> = Omit<ExpressionContentByKind<K>, "value"> & {
  value: Omit<ExpressionContentByKind<K>["value"], SkipFields> & ReplaceFields;
};

export type SerializedExpressionContent =
  | Exclude<
      ExpressionContent,
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
  | SerializedExpressionContentByKindGeneric<"Value", number>
  | SerializedExpressionContentByKindGeneric<"Block", number[]>
  | SerializedExpressionContentByKindObjectLike<
      "Program",
      "statements",
      {
        statements: number[];
      }
    >
  | SerializedExpressionContentByKindObjectLike<
      "Ternary",
      "condition" | "ifTrue" | "ifFalse",
      {
        condition: number;
        ifTrue: number;
        ifFalse: number;
      }
    >
  | SerializedExpressionContentByKindObjectLike<
      "Assign",
      "right",
      {
        right: number;
      }
    >
  | SerializedExpressionContentByKindObjectLike<
      "Call",
      "fn" | "args",
      {
        fn: number;
        args: number[];
      }
    >
  | SerializedExpressionContentByKindObjectLike<
      "Lambda",
      "parameters" | "body",
      {
        parameters: SerializedLambdaExpressionParameter[];
        body: number;
      }
    >
  | SerializedExpressionContentByKindGeneric<"Array", number[]>
  | SerializedExpressionContentByKindGeneric<"Dict", [number, number][]>;

export type SerializedExpression = SerializedExpressionContent & {
  ast: number;
};

function serializeExpressionContent(
  expression: ExpressionContent,
  visit: SquiggleSerializationVisitor
): SerializedExpressionContent {
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

export function serializeExpression(
  expression: Expression,
  visit: SquiggleSerializationVisitor
) {
  return {
    ...serializeExpressionContent(expression, visit),
    ast: visit.ast(expression.ast),
  };
}

function deserializeExpressionContent(
  expression: SerializedExpression,
  visit: SquiggleDeserializationVisitor
): ExpressionContent {
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

export function deserializeExpression(
  expression: SerializedExpression,
  visit: SquiggleDeserializationVisitor
): Expression {
  return {
    ...deserializeExpressionContent(expression, visit),
    ast: visit.ast(expression.ast),
  };
}
