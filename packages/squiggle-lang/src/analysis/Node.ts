import { LocationRange } from "../ast/types.js";
import { FRType } from "../library/registry/frTypes.js";
import { TypedASTNode } from "./types.js";

export abstract class Node<T extends string> {
  parent: TypedASTNode | null = null;

  constructor(
    public kind: T,
    public location: LocationRange
  ) {}
}

export abstract class ExpressionNode<T extends string> extends Node<T> {
  constructor(
    kind: T,
    location: LocationRange,
    public type: FRType<any>
  ) {
    super(kind, location);
  }
}
