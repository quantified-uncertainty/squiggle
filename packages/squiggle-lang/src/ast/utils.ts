import { LocationRange } from "peggy";

import { ASTNode } from "./peggyHelpers.js";

export function locationContains(location: LocationRange, offset: number) {
  return location.start.offset <= offset && location.end.offset >= offset;
}

function isBindingStatement(
  statement: ASTNode
): statement is Extract<ASTNode, { type: "LetStatement" | "DefunStatement" }> {
  return (
    statement.type === "LetStatement" || statement.type === "DefunStatement"
  );
}

/* Used for "focus in editor" feature in the playground.
 * It tries its best to find nested ASTs, but when the value is built dynamically, it's not always possible.
 * In that case, it returns the outermost location that can be inferred statically.
 */
export function findLocationByPath(
  ast: ASTNode,
  path: (string | number)[]
): LocationRange {
  if (!path.length) {
    return ast.location;
  }

  switch (ast.type) {
    case "Program": {
      if (!ast.statements.length) {
        break;
      }
      const lastStatement = ast.statements[ast.statements.length - 1];
      if (isBindingStatement(lastStatement)) {
        // looking in bindings
        for (const statement of ast.statements) {
          if (!isBindingStatement(statement)) {
            continue;
          }
          if (statement.variable.value === path[0]) {
            return findLocationByPath(statement.value, path.slice(1));
          }
        }
      } else {
        // looking in end expression
        return findLocationByPath(lastStatement, path);
      }
      break;
    }
    case "Record":
      for (const { key, value } of ast.elements) {
        if (
          (key.type === "String" || key.type === "Integer") &&
          key.value === path[0]
        ) {
          return findLocationByPath(value, path.slice(1));
        }
      }
      break;
    case "Array":
      if (typeof path[0] === "number") {
        const element = ast.elements[path[0]];
        if (element) {
          return findLocationByPath(element, path.slice(1));
        }
      }
      break;
    case "Block":
      if (ast.statements.length === 1) {
        return findLocationByPath(ast.statements[0], path);
      }
      break;
    case "Lambda":
      // TODO - if lambda's end expression is a record or an array, we could return it
      break;
  }
  return ast.location;
}
