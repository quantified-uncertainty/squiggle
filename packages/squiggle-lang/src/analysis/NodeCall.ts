import { KindNode, LocationRange } from "../ast/types.js";
import { frAny } from "../library/registry/frTypes.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { AnyExpressionNode } from "./types.js";

export class NodeCall extends ExpressionNode<"Call"> {
  private constructor(
    location: LocationRange,
    public fn: AnyExpressionNode,
    public args: AnyExpressionNode[]
  ) {
    super(
      "Call",
      location,
      frAny() // TODO - infer
    );
  }

  static fromAst(node: KindNode<"Call">, context: AnalysisContext): NodeCall {
    const fn = analyzeExpression(node.fn, context);
    const args = node.args.map((arg) => analyzeExpression(arg, context));

    return new NodeCall(node.location, fn, args);
  }
}
