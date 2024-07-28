import { KindNode, LocationRange } from "../ast/types.js";
import { frBool } from "../library/registry/frTypes.js";
import { ExpressionNode } from "./Node.js";

export class NodeBoolean extends ExpressionNode<"Boolean"> {
  private constructor(
    location: LocationRange,
    public value: boolean
  ) {
    super("Boolean", location, frBool);
  }

  static fromAst(node: KindNode<"Boolean">): NodeBoolean {
    return new NodeBoolean(node.location, node.value);
  }
}
