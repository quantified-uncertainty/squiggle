import { KindNode, LocationRange } from "../ast/types.js";
import { frAny } from "../library/registry/frTypes.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { AnyExpressionNode } from "./types.js";

export class NodeTernary extends ExpressionNode<"Ternary"> {
  private constructor(
    location: LocationRange,
    public condition: AnyExpressionNode,
    public trueExpression: AnyExpressionNode,
    public falseExpression: AnyExpressionNode,
    public syntax: "IfThenElse" | "C"
  ) {
    super(
      "Ternary",
      location,
      frAny() // TODO - infer, union of true and false expression types
    );
  }

  static fromAst(
    node: KindNode<"Ternary">,
    context: AnalysisContext
  ): NodeTernary {
    return new NodeTernary(
      node.location,
      analyzeExpression(node.condition, context),
      analyzeExpression(node.trueExpression, context),
      analyzeExpression(node.falseExpression, context),
      node.syntax
    );
  }
}
