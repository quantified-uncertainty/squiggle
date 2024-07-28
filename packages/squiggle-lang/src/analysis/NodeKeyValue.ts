import { KindNode, LocationRange } from "../ast/types.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { Node } from "./Node.js";
import { AnyExpressionNode } from "./types.js";

export class NodeKeyValue extends Node<"KeyValue"> {
  private constructor(
    location: LocationRange,
    public key: AnyExpressionNode,
    public value: AnyExpressionNode
  ) {
    super("KeyValue", location);
  }

  static fromAst(
    node: KindNode<"KeyValue">,
    context: AnalysisContext
  ): NodeKeyValue {
    return new NodeKeyValue(
      node.location,
      analyzeExpression(node.key, context),
      analyzeExpression(node.value, context)
    );
  }
}
