import { LocationRange } from "../ast/types.js";
import { Type } from "../types/Type.js";
import { TypedASTNode } from "./types.js";

export abstract class Node<T extends string> {
  parent: TypedASTNode | null = null;

  constructor(
    public kind: T,
    public location: LocationRange
  ) {}

  // must be called by node constructor after super()
  protected _init() {
    for (const node of this.children()) {
      node.parent = this as unknown as TypedASTNode; // TypedASTNode includes all subclasses of Node, so this is safe
    }
  }

  abstract children(): TypedASTNode[];
}

export abstract class ExpressionNode<T extends string> extends Node<T> {
  constructor(
    kind: T,
    location: LocationRange,
    public type: Type<any>
  ) {
    super(kind, location);
  }
}
