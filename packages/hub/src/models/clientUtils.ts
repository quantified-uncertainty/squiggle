// TODO - should use versioned-components
import { ASTNode, parse } from "@quri/squiggle-lang";

function astToVariableNames(ast: ASTNode): string[] {
  const exportedVariableNames: string[] = [];

  if (ast.kind === "Program") {
    ast.statements.forEach((statement) => {
      if (
        (statement.kind === "LetStatement" ||
          statement.kind === "DefunStatement") &&
        statement.exported
      ) {
        exportedVariableNames.push(statement.variable.value);
      }
    });
  }

  return exportedVariableNames;
}

export function getExportedVariableNames(code: string): string[] {
  const ast = parse(code);
  if (ast.ok) {
    return astToVariableNames(ast.value);
  } else {
    return [];
  }
}
