import { KindNode, LocationRange } from "../ast/types.js";
import { tAny } from "../types/index.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { AnyExpressionNode } from "./types.js";

export class NodeDotLookup extends ExpressionNode<"DotLookup"> {
  private constructor(
    location: LocationRange,
    public arg: AnyExpressionNode,
    public key: string
  ) {
    super(
      "DotLookup",
      location,
      tAny() // TODO - infer
    );
    this._init();
  }

  children() {
    return [this.arg];
  }

  static fromAst(
    node: KindNode<"DotLookup">,
    context: AnalysisContext
  ): NodeDotLookup {
    return new NodeDotLookup(
      node.location,
      analyzeExpression(node.arg, context),
      node.key
    );
  }
}
