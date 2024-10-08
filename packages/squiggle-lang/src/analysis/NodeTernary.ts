import { KindNode, LocationRange } from "../ast/types.js";
import { makeUnionAndSimplify } from "../types/helpers.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { AnyTypedExpressionNode } from "./types.js";

export class NodeTernary extends ExpressionNode<"Ternary"> {
  private constructor(
    location: LocationRange,
    public condition: AnyTypedExpressionNode,
    public trueExpression: AnyTypedExpressionNode,
    public falseExpression: AnyTypedExpressionNode,
    public syntax: "IfThenElse" | "C"
  ) {
    super(
      "Ternary",
      location,
      makeUnionAndSimplify([trueExpression.type, falseExpression.type])
    );
    this._init();
  }

  children() {
    return [this.condition, this.trueExpression, this.falseExpression];
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
