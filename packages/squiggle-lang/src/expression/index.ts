/*
 * An expression is an intermediate representation of a Squiggle code.
 * Expressions are evaluated by reducer's `evaluate` function.
 */
import { ASTNode } from "../ast/parse.js";
import { Value, vVoid } from "../value/index.js";

export type LambdaExpressionParameter = {
  name: string;
  annotation?: Expression;
};

// All shapes are type+value, to help with V8 monomorphism.
export type ExpressionContent =
  | {
      type: "Block";
      value: Expression[];
    }
  | {
      // Programs are similar to blocks, but they can export things for other modules to use.
      // There can be only one program at the top level of the expression.
      type: "Program";
      value: {
        statements: Expression[];
        exports: string[];
      };
    }
  | {
      type: "Array";
      value: Expression[];
    }
  | {
      type: "Dict";
      value: [Expression, Expression][];
    }
  | {
      type: "ResolvedSymbol";
      value: {
        name: string;
        // Position on stack, counting backwards (so last variable on stack has offset=0).
        // It's important to count backwards, because we want to store imports and continues on top of the stack.
        // (And maybe stdLib too, in the future.)
        offset: number;
      };
    }
  | {
      type: "Ternary";
      value: {
        condition: Expression;
        ifTrue: Expression;
        ifFalse: Expression;
      };
    }
  | {
      type: "Assign";
      value: {
        left: string;
        right: Expression;
      };
    }
  | {
      type: "Call";
      value: {
        fn: Expression;
        args: Expression[];
      };
    }
  | {
      type: "Lambda";
      value: {
        name?: string;
        parameters: LambdaExpressionParameter[];
        body: Expression;
      };
    }
  | {
      type: "Value";
      value: Value;
    };

export type Expression = ExpressionContent & { ast: ASTNode };

export const eArray = (anArray: Expression[]): ExpressionContent => ({
  type: "Array",
  value: anArray,
});

export const eValue = (value: Value): ExpressionContent => ({
  type: "Value",
  value,
});

export const eCall = (
  fn: Expression,
  args: Expression[]
): ExpressionContent => ({
  type: "Call",
  value: {
    fn,
    args,
  },
});

export const eLambda = (
  name: string | undefined,
  parameters: LambdaExpressionParameter[],
  body: Expression
): ExpressionContent => ({
  type: "Lambda",
  value: {
    name,
    parameters,
    body,
  },
});

export const eDict = (aMap: [Expression, Expression][]): ExpressionContent => ({
  type: "Dict",
  value: aMap,
});

export const eResolvedSymbol = (
  name: string,
  offset: number
): ExpressionContent => ({
  type: "ResolvedSymbol",
  value: { name, offset },
});

export const eBlock = (exprs: Expression[]): ExpressionContent => ({
  type: "Block",
  value: exprs,
});

export const eProgram = (
  statements: Expression[],
  exports: string[]
): ExpressionContent => ({
  type: "Program",
  value: {
    statements,
    exports,
  },
});

export const eLetStatement = (
  left: string,
  right: Expression
): ExpressionContent => ({
  type: "Assign",
  value: {
    left,
    right,
  },
});

export const eTernary = (
  condition: Expression,
  ifTrue: Expression,
  ifFalse: Expression
): ExpressionContent => ({
  type: "Ternary",
  value: {
    condition,
    ifTrue,
    ifFalse,
  },
});

export const eVoid = (): ExpressionContent => ({
  type: "Value",
  value: vVoid(),
});

// Converts the expression to String. Useful for tests.
export function expressionToString(expression: Expression): string {
  switch (expression.type) {
    case "Block":
      return `{${expression.value.map(expressionToString).join("; ")}}`;
    case "Program": {
      const exports = new Set<string>(expression.value.exports);
      return expression.value.statements
        .map((statement) => {
          const statementString = expressionToString(statement);
          return statement.type === "Assign" &&
            exports.has(statement.value.left)
            ? `export ${statementString}`
            : statementString;
        })
        .join("; ");
    }
    case "Array":
      return `[${expression.value.map(expressionToString).join(", ")}]`;
    case "Dict":
      return `{${expression.value
        .map(
          ([key, value]) =>
            `${expressionToString(key)}: ${expressionToString(value)}`
        )
        .join(", ")}}`;
    case "ResolvedSymbol":
      // it would be useful to output the offset here, but we need to update tests accordingly
      return expression.value.name;
    case "Ternary":
      return `${expressionToString(
        expression.value.condition
      )} ? (${expressionToString(
        expression.value.ifTrue
      )}) : (${expressionToString(expression.value.ifFalse)})`;
    case "Assign":
      return `${expression.value.left} = ${expressionToString(
        expression.value.right
      )}`;
    case "Call":
      return `(${expressionToString(
        expression.value.fn
      )})(${expression.value.args.map(expressionToString).join(", ")})`;
    case "Lambda":
      return `{|${expression.value.parameters
        .map((parameter) => parameter.name)
        .join(", ")}| ${expressionToString(expression.value.body)}}`;
    case "Value":
      return expression.value.toString();
    default:
      return `Unknown expression ${expression satisfies never}`;
  }
}
