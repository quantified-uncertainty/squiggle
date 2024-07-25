import { parse } from "../../src/ast/parse.js";
import { compileAst } from "../../src/expression/compile.js";
import { expressionToString } from "../../src/expression/index.js";
import { getStdLib } from "../../src/library/index.js";
import * as Result from "../../src/utility/result.js";

export function testCompile(
  code: string,
  answer: string | string[],
  {
    pretty = false,
    mode = "statements",
  }: {
    pretty?: boolean;
    // For `x = 5; x + 1` source:
    // "full": (Program (.statements (Assign x 5) (Call add (StackRef 0) 1)) (.bindings (x 1)))
    // "statements": (Assign x 5) (Call add (StackRef 0) 1)
    // "last-statement": (Assign x 5)
    // "end": (Call add (StackRef 0) 1)
    mode?: "full" | "end" | "statements" | "last-statement";
  } = {}
) {
  test(code, async () => {
    const rExpr = Result.bind(parse(code, "test"), (ast) =>
      compileAst(ast, getStdLib())
    );

    let serializedExpr: string | string[];
    if (rExpr.ok) {
      const expr = rExpr.value;
      if (expr.kind !== "Program") {
        throw new Error("Expected a program");
      }
      switch (mode) {
        case "full":
          serializedExpr = expressionToString(expr, { pretty });
          break;
        case "statements": {
          // TODO - this name is confusing, we're serializing both statements and the end result
          serializedExpr = [
            ...expr.value.statements,
            ...(expr.value.result ? [expr.value.result] : []),
          ].map((statement) => expressionToString(statement, { pretty }));
          break;
        }
        case "last-statement": {
          const lastStatement = expr.value.statements.at(-1);
          if (!lastStatement) {
            throw new Error("No end result");
          }
          serializedExpr = expressionToString(lastStatement, { pretty });
          break;
        }
        case "end": {
          const result = expr.value.result;
          if (!result) {
            throw new Error("No end result");
          }
          serializedExpr = expressionToString(result, { pretty });
          break;
        }
      }
    } else {
      serializedExpr = `Error(${rExpr.value.toString()})`;
    }

    expect(serializedExpr).toEqual(answer);
  });
}

// shortcuts
export function testCompileEnd(
  code: string,
  answer: string,
  { pretty = false }: { pretty?: boolean } = {}
) {
  testCompile(code, answer, { pretty, mode: "end" });
}

export function testCompileLastStatement(
  code: string,
  answer: string,
  { pretty = false }: { pretty?: boolean } = {}
) {
  testCompile(code, answer, { pretty, mode: "last-statement" });
}
