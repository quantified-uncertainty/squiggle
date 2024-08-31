import { KindNode, LocationRange } from "../ast/types.js";
import { tString } from "../types/index.js";
import { ExpressionNode } from "./Node.js";

export class NodeString extends ExpressionNode<"String"> {
  private constructor(
    location: LocationRange,
    public value: string
  ) {
    super("String", location, tString);
    this._init();
  }

  children() {
    return [];
  }

  static fromAst(node: KindNode<"String">): NodeString {
    return new NodeString(node.location, node.value);
  }
}
