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
    // "end": (Call add (StackRef 0) 1)
    mode?: "full" | "end" | "statements";
  } = {}
) {
  test(code, async () => {
    const rExpr = Result.bind(parse(code, "test"), (ast) =>
      compileAst(ast, getStdLib())
    );

    let serializedExpr: string | string[];
    if (rExpr.ok) {
      const expr = rExpr.value;
      switch (mode) {
        case "full":
          serializedExpr = expressionToString(expr, { pretty });
          break;
        case "statements": {
          if (expr.kind !== "Program") {
            throw new Error("Expected a program");
          }
          serializedExpr = expr.value.statements.map((statement) =>
            expressionToString(statement, { pretty })
          );
          break;
        }
        case "end": {
          if (expr.kind !== "Program") {
            throw new Error("Expected a program");
          }
          const lastStatement = expr.value.statements.at(-1);
          if (!lastStatement) {
            throw new Error("No last statement");
          }
          serializedExpr = expressionToString(lastStatement, { pretty });
          break;
        }
      }
    } else {
      serializedExpr = `Error(${rExpr.value.toString()})`;
    }

    expect(serializedExpr).toEqual(answer);
  });
}
// shortcut

export function testCompileEnd(
  code: string,
  answer: string,
  { pretty = false }: { pretty?: boolean } = {}
) {
  testCompile(code, answer, { pretty, mode: "end" });
}
