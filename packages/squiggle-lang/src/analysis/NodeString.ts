import { KindNode, LocationRange } from "../ast/types.js";
import { frString } from "../library/registry/frTypes.js";
import { ExpressionNode } from "./Node.js";

export class NodeString extends ExpressionNode<"String"> {
  private constructor(
    location: LocationRange,
    public value: string
  ) {
    super("String", location, frString);
    this._init();
  }

  children() {
    return [];
  }

  static fromAst(node: KindNode<"String">): NodeString {
    return new NodeString(node.location, node.value);
  }
}
