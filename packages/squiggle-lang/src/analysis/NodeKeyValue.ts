import { KindNode, LocationRange } from "../ast/types.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { Node } from "./Node.js";
import { AnyTypedExpressionNode } from "./types.js";

export class NodeKeyValue extends Node<"KeyValue"> {
  private constructor(
    location: LocationRange,
    public key: AnyTypedExpressionNode,
    public value: AnyTypedExpressionNode
  ) {
    super("KeyValue", location);
    this._init();
  }

  children() {
    return [this.key, this.value];
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
