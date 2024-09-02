// Peggy grammar is not type-safe, so we make additional checks to make sure that TypeScript types are correct.

import { ICompileError } from "../errors/IError.js";
import {
  ASTNode,
  expressionKinds,
  KindNode,
  statementKinds,
  unitTypeKinds,
} from "./types.js";

export function assertKind<Kind extends ASTNode["kind"]>(
  node: ASTNode,
  kind: Kind
) {
  if (node.kind !== kind) {
    // shouldn't happen if Peggy grammar is correct
    throw new ICompileError(
      `Internal error: Expected ${kind}, got ${node.kind}`,
      node.location
    );
  }
  return node as KindNode<Kind>;
}

function assertOneOfKindsOrThrow<Kind extends ASTNode["kind"]>(
  node: ASTNode,
  kinds: readonly Kind[],
  kindsName?: string
): asserts node is KindNode<Kind> {
  if (!(kinds as readonly string[]).includes(node.kind)) {
    // shouldn't happen if Peggy grammar is correct
    throw new ICompileError(
      `Internal error: Expected ${kindsName ?? kinds.join("|")}, got ${node.kind}`,
      node.location
    );
  }
}

export function assertOneOfKinds<Kind extends ASTNode["kind"]>(
  node: ASTNode,
  kinds: readonly Kind[],
  kindsName?: string
) {
  assertOneOfKindsOrThrow(node, kinds, kindsName);
  return node;
}

export function assertStatement(node: ASTNode) {
  assertOneOfKindsOrThrow(node, statementKinds, "statement");
  return node;
}

export function assertExpression(node: ASTNode) {
  assertOneOfKindsOrThrow(node, expressionKinds, "expression");
  return node;
}

export function assertUnitType(node: ASTNode) {
  assertOneOfKindsOrThrow(node, unitTypeKinds, "unit type");
  return node;
}
