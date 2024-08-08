import { ASTNode, LocationRange } from "./types.js";

export function locationContains(location: LocationRange, offset: number) {
  return location.start.offset <= offset && location.end.offset >= offset;
}

export function isBindingStatement(
  statement: ASTNode
): statement is Extract<ASTNode, { kind: "LetStatement" | "DefunStatement" }> {
  return (
    statement.kind === "LetStatement" || statement.kind === "DefunStatement"
  );
}
