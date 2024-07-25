import { TypedASTNode } from "../analysis/types.js";
import { LocationRange } from "./types.js";

export function locationContains(location: LocationRange, offset: number) {
  return location.start.offset <= offset && location.end.offset >= offset;
}

export function isBindingStatement(
  statement: TypedASTNode
): statement is Extract<
  TypedASTNode,
  { kind: "LetStatement" | "DefunStatement" }
> {
  return (
    statement.kind === "LetStatement" || statement.kind === "DefunStatement"
  );
}
