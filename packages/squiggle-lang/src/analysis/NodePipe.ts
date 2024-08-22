import { KindNode, LocationRange } from "../ast/types.js";
import { Type } from "../types/Type.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { inferCallType } from "./NodeCall.js";
import { AnyTypedExpressionNode } from "./types.js";

export class NodePipe extends ExpressionNode<"Pipe"> {
  private constructor(
    location: LocationRange,
    public leftArg: AnyTypedExpressionNode,
    public fn: AnyTypedExpressionNode,
    public rightArgs: AnyTypedExpressionNode[],
    type: Type
  ) {
    super("Pipe", location, type);
    this._init();
  }

  children() {
    return [this.leftArg, this.fn, ...this.rightArgs];
  }

  static fromAst(node: KindNode<"Pipe">, context: AnalysisContext): NodePipe {
    const fn = analyzeExpression(node.fn, context);
    const leftArg = analyzeExpression(node.leftArg, context);
    const rightArgs = node.rightArgs.map((arg) =>
      analyzeExpression(arg, context)
    );
    const type = inferCallType(node.location, fn, [leftArg, ...rightArgs]);

    return new NodePipe(node.location, leftArg, fn, rightArgs, type);
  }
}
