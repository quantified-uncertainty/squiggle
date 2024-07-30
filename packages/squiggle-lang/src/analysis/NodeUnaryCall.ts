import { KindNode, LocationRange, UnaryOperator } from "../ast/types.js";
import { frAny } from "../library/registry/frTypes.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { AnyExpressionNode } from "./types.js";

export class NodeUnaryCall extends ExpressionNode<"UnaryCall"> {
  private constructor(
    location: LocationRange,
    public op: UnaryOperator,
    public arg: AnyExpressionNode
  ) {
    super(
      "UnaryCall",
      location,
      frAny() // TODO - function result type
    );
    this._init();
  }

  children() {
    return [this.arg];
  }

  static fromAst(
    node: KindNode<"UnaryCall">,
    context: AnalysisContext
  ): NodeUnaryCall {
    return new NodeUnaryCall(
      node.location,
      node.op,
      analyzeExpression(node.arg, context)
    );
  }
}
