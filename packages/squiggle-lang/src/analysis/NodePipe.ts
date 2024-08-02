import { KindNode, LocationRange } from "../ast/types.js";
import { tAny } from "../types/index.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { AnyExpressionNode } from "./types.js";

export class NodePipe extends ExpressionNode<"Pipe"> {
  private constructor(
    location: LocationRange,
    public leftArg: AnyExpressionNode,
    public fn: AnyExpressionNode,
    public rightArgs: AnyExpressionNode[]
  ) {
    super(
      "Pipe",
      location,
      tAny() // TODO - infer from `fn` and arg types
    );
    this._init();
  }

  children() {
    return [this.leftArg, this.fn, ...this.rightArgs];
  }

  static fromAst(node: KindNode<"Pipe">, context: AnalysisContext): NodePipe {
    return new NodePipe(
      node.location,
      analyzeExpression(node.leftArg, context),
      analyzeExpression(node.fn, context),
      node.rightArgs.map((arg) => analyzeExpression(arg, context))
    );
  }
}
