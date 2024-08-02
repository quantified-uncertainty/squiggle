import { KindNode, LocationRange } from "../ast/types.js";
import { tBool } from "../types/index.js";
import { ExpressionNode } from "./Node.js";

export class NodeBoolean extends ExpressionNode<"Boolean"> {
  private constructor(
    location: LocationRange,
    public value: boolean
  ) {
    super("Boolean", location, tBool);
    this._init();
  }

  children() {
    return [];
  }

  static fromAst(node: KindNode<"Boolean">): NodeBoolean {
    return new NodeBoolean(node.location, node.value);
  }
}
