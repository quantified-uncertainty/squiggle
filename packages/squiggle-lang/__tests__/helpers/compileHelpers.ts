import { analyzeAst } from "../../src/analysis/index.js";
import { parse } from "../../src/ast/parse.js";
import { compileTypedAst } from "../../src/compiler/index.js";
import { irToString } from "../../src/compiler/toString.js";
import { ProgramIR } from "../../src/compiler/types.js";
import { ICompileError } from "../../src/errors/IError.js";
import { bind, result } from "../../src/utility/result.js";

export function compileStringToIR(
  code: string,
  name = "test"
): result<ProgramIR, ICompileError[]> {
  return bind(
    bind(parse(code, name), (ast) => analyzeAst(ast)),
    (typedAst) => compileTypedAst({ ast: typedAst, imports: {} })
  );
}

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
    const rExpr = compileStringToIR(code, "test");

    let serializedExpr: string | string[];
    if (rExpr.ok) {
      const expr = rExpr.value;
      if (expr.kind !== "Program") {
        throw new Error("Expected a program");
      }
      switch (mode) {
        case "full":
          serializedExpr = irToString(expr, { pretty });
          break;
        case "statements": {
          // TODO - this name is confusing, we're serializing both statements and the end result
          serializedExpr = [
            ...expr.value.statements,
            ...(expr.value.result ? [expr.value.result] : []),
          ].map((statement) => irToString(statement, { pretty }));
          break;
        }
        case "last-statement": {
          const lastStatement = expr.value.statements.at(-1);
          if (!lastStatement) {
            throw new Error("No end result");
          }
          serializedExpr = irToString(lastStatement, { pretty });
          break;
        }
        case "end": {
          const result = expr.value.result;
          if (!result) {
            throw new Error("No end result");
          }
          serializedExpr = irToString(result, { pretty });
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
