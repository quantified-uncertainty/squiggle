import { NodeImport } from "../analysis/NodeImport.js";
import { ICompileError } from "../errors/IError.js";
import { CompileContext } from "./context.js";
import { make, StatementIR } from "./types.js";

/*
 * Imports are treated similarly to let/defun statements; they produce Assign
 * nodes based on pre-calculated values passed to the compiler.
 *
 * To see how the import values are calculated, check `SqModuleOutput` implementation.
 */
export function compileImport(
  ast: NodeImport,
  context: CompileContext
): StatementIR {
  const name = ast.variable.value;
  const value = context.imports[ast.path.value];
  if (value === undefined) {
    throw new ICompileError(
      `Import not found: ${ast.path.value}`,
      ast.location
    );
  }

  context.defineLocal(ast.variable);
  return {
    ...make("Assign", {
      left: name,
      right: { ...make("Value", value), location: ast.variable.location },
    }),
    location: ast.location,
  };
}
