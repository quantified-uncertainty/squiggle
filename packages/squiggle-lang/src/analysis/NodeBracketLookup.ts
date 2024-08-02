import { KindNode, LocationRange } from "../ast/types.js";
import { tAny } from "../types/index.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { AnyExpressionNode } from "./types.js";

export class NodeBracketLookup extends ExpressionNode<"BracketLookup"> {
  private constructor(
    location: LocationRange,
    public arg: AnyExpressionNode,
    public key: AnyExpressionNode
  ) {
    super(
      "BracketLookup",
      location,
      tAny() // TODO - infer
    );
    this._init();
  }

  children() {
    return [this.arg, this.key];
  }

  static fromAst(
    node: KindNode<"BracketLookup">,
    context: AnalysisContext
  ): NodeBracketLookup {
    return new NodeBracketLookup(
      node.location,
      analyzeExpression(node.arg, context),
      analyzeExpression(node.key, context)
    );
  }
}
