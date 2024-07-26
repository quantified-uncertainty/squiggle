import { KindTypedNode, TypedAST } from "../analysis/types.js";
import { ICompileError } from "../errors/IError.js";
import { Bindings } from "../reducer/Stack.js";
import * as Result from "../utility/result.js";
import { compileExpression } from "./compileExpression.js";
import { compileStatement } from "./compileStatement.js";
import { CompileContext } from "./context.js";
import * as ir from "./types.js";

function compileProgram(
  ast: KindTypedNode<"Program">,
  context: CompileContext
): ir.ProgramIR {
  // No need to start a top-level scope, it already exists.
  const statements: ir.StatementIR[] = [];
  const exports: string[] = [];
  for (const astStatement of ast.statements) {
    const statement = compileStatement(astStatement, context);
    statements.push(statement);
    if (astStatement.exported) {
      const name = astStatement.variable.value;
      exports.push(name);
    }
  }
  const result = ast.result
    ? compileExpression(ast.result, context)
    : undefined;

  return {
    ...ir.make("Program", {
      statements,
      result,
      exports,
      bindings: context.localsOffsets(),
    }),
    location: ast.location,
  };
}

export function compileAst(
  ast: TypedAST,
  externals: Bindings
): Result.result<ir.ProgramIR, ICompileError> {
  try {
    const ir = compileProgram(ast, new CompileContext(externals));
    return Result.Ok(ir);
  } catch (err) {
    if (err instanceof ICompileError) {
      return Result.Err(err);
    }
    throw err; // internal error, better to detect early (but maybe we should wrap this in IOtherError instead)
  }
}
