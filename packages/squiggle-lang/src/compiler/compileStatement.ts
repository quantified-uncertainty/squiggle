import { AnyTypedStatementNode } from "../analysis/types.js";
import { compileExpression } from "./compileExpression.js";
import { CompileContext } from "./context.js";
import { eCall, make, StatementIR } from "./types.js";

export function compileStatement(
  ast: AnyTypedStatementNode,
  context: CompileContext
): StatementIR {
  const name = ast.variable.value;
  let value = compileExpression(ast.value, context);

  for (const decorator of [...ast.decorators].reverse()) {
    const decoratorFn = context.resolveBuiltin(
      ast.location,
      `Tag.${decorator.name.value}`
    );
    value = {
      ...eCall(
        decoratorFn,
        [
          value,
          ...decorator.args.map((arg) => compileExpression(arg, context)),
        ],
        "decorate"
      ),
      location: ast.location,
    };
  }

  context.defineLocal(ast.variable);
  return {
    ...make("Assign", { left: name, right: value }),
    location: ast.location,
  };
}
