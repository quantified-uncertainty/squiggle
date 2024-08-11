import { KindTypedNode, TypedAST } from "../analysis/types.js";
import { ICompileError } from "../errors/IError.js";
import { getStdLib } from "../library/index.js";
import { Bindings } from "../reducer/Stack.js";
import * as Result from "../utility/result.js";
import { Value } from "../value/index.js";
import { compileExpression } from "./compileExpression.js";
import { compileImport } from "./compileImport.js";
import { compileStatement } from "./compileStatement.js";
import { CompileContext } from "./context.js";
import * as ir from "./types.js";

function compileProgram(
  ast: KindTypedNode<"Program">,
  context: CompileContext
): ir.ProgramIR {
  // No need to start a top-level scope, it already exists.
  const statements: ir.StatementIR[] = [];

  for (const importNode of ast.imports) {
    statements.push(compileImport(importNode, context));
  }

  const exports: string[] = [];

  // absolute stack positions
  const absoluteBindings: Record<string, number> = {};
  const scope = context.scopes.at(-1)!;
  for (const astStatement of ast.statements) {
    const statement = compileStatement(astStatement, context);
    statements.push(statement);

    const name = astStatement.variable.value;
    if (astStatement.exported) {
      exports.push(name);
    }
    absoluteBindings[name] = scope.stack.size - 1;
  }
  const bindings: Record<string, number> = {};
  for (const [name, offset] of Object.entries(absoluteBindings)) {
    bindings[name] = scope.stack.size - 1 - offset;
  }

  const result = ast.result
    ? compileExpression(ast.result, context)
    : undefined;

  return {
    ...ir.make("Program", {
      statements,
      result,
      exports,
      bindings,
    }),
    location: ast.location,
  };
}

export function compileTypedAst({
  ast,
  stdlib,
  imports,
}: {
  ast: TypedAST;
  stdlib?: Bindings; // if not defined, default stdlib will be used
  imports: Record<string, Value>; // mapping of import strings (original paths) to values
}): Result.result<ir.ProgramIR, ICompileError> {
  try {
    const ir = compileProgram(
      ast,
      new CompileContext(stdlib ?? getStdLib(), imports)
    );
    return Result.Ok(ir);
  } catch (err) {
    if (err instanceof ICompileError) {
      return Result.Err(err);
    }
    throw err; // internal error, better to detect early (but maybe we should wrap this in IOtherError instead)
  }
}
