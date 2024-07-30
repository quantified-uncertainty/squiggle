import { InfixOperator, KindNode, LocationRange } from "../ast/types.js";
import { frAny } from "../library/registry/frTypes.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { AnyExpressionNode } from "./types.js";

export class NodeInfixCall extends ExpressionNode<"InfixCall"> {
  private constructor(
    location: LocationRange,
    public op: InfixOperator,
    public args: [AnyExpressionNode, AnyExpressionNode]
  ) {
    super("InfixCall", location, frAny());
    this._init();
  }

  children() {
    return this.args;
  }

  static fromAst(
    node: KindNode<"InfixCall">,
    context: AnalysisContext
  ): NodeInfixCall {
    return new NodeInfixCall(node.location, node.op, [
      analyzeExpression(node.args[0], context),
      analyzeExpression(node.args[1], context),
    ]);
  }
}
