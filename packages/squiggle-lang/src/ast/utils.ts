import { LocationRange } from "peggy";
import { ASTNode } from "./peggyHelpers.js";

function locationContains(location: LocationRange, offset: number) {
  return location.start.offset <= offset && location.end.offset > offset;
}

export function findInnermostPublicNode(
  ast: ASTNode,
  offset: number
): ASTNode | undefined {
  switch (ast.type) {
    case "Program": {
      for (const statement of ast.statements) {
        if (locationContains(statement.location, offset)) {
          return findInnermostPublicNode(statement, offset);
        }
      }
      return;
    }
    case "Record": {
      for (const pair of ast.elements) {
        if (
          locationContains(
            {
              source: ast.location.source,
              start: pair.key.location.start,
              end: pair.key.location.end,
            },
            offset
          )
        ) {
          return findInnermostPublicNode(pair.value, offset) ?? ast;
        }
      }
      return ast;
    }
    case "Array": {
      for (const element of ast.elements) {
        if (locationContains(element.location, offset)) {
          return findInnermostPublicNode(element, offset);
        }
      }
      return ast;
    }
    case "LetStatement": {
      return findInnermostPublicNode(ast.value, offset);
    }
    case "DefunStatement": {
      return findInnermostPublicNode(ast.value, offset);
    }
  }
}
