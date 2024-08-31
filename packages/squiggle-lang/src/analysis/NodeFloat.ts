import { KindNode, LocationRange } from "../ast/types.js";
import { tNumber } from "../types/index.js";
import { ExpressionNode } from "./Node.js";

export class NodeFloat extends ExpressionNode<"Float"> {
  private constructor(
    location: LocationRange,
    public integer: number,
    public fractional: string | null,
    public exponent: number | null
  ) {
    super("Float", location, tNumber);
    this._init();
  }

  children() {
    return [];
  }

  static fromAst(node: KindNode<"Float">) {
    return new NodeFloat(
      node.location,
      node.integer,
      node.fractional,
      node.exponent
    );
  }
}
