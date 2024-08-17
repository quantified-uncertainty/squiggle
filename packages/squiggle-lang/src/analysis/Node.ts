import { LocationRange } from "../ast/types.js";
import { Type } from "../types/Type.js";
import {
  AnyTypedExpressionNode,
  expressionKinds,
  TypedASTNode,
} from "./types.js";

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

  findDescendantByLocation(
    start: number,
    end: number
  ): TypedASTNode | undefined {
    if (this.location.start.offset > start && this.location.end.offset < end) {
      return undefined;
    }

    if (
      this.location.start.offset === start &&
      this.location.end.offset === end
    ) {
      return this as unknown as TypedASTNode;
    }

    for (const child of this.children()) {
      const result = child.findDescendantByLocation(start, end);
      if (result) {
        return result;
      }
    }
  }

  isExpression(): this is AnyTypedExpressionNode {
    return (expressionKinds as string[]).includes(this.kind);
  }
}

export abstract class ExpressionNode<T extends string> extends Node<T> {
  constructor(
    kind: T,
    location: LocationRange,
    public type: Type
  ) {
    super(kind, location);
  }
}
