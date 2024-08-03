import { infixFunctions } from "../ast/operators.js";
import { InfixOperator, KindNode, LocationRange } from "../ast/types.js";
import { Type } from "../types/Type.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { AnyExpressionNode } from "./types.js";

export class NodeInfixCall extends ExpressionNode<"InfixCall"> {
  private constructor(
    location: LocationRange,
    public op: InfixOperator,
    public args: [AnyExpressionNode, AnyExpressionNode],
    type: Type<unknown>
  ) {
    super("InfixCall", location, type);
    this._init();
  }

  children() {
    return this.args;
  }

  static fromAst(
    node: KindNode<"InfixCall">,
    context: AnalysisContext
  ): NodeInfixCall {
    const fn = context.stdlib.get(infixFunctions[node.op]);
    if (!fn) {
      throw new Error(`Infix function not found: ${node.op}`);
    }
    if (fn.type !== "Lambda") {
      throw new Error(`Expected infix function to be a function`);
    }

    const arg1 = analyzeExpression(node.args[0], context);
    const arg2 = analyzeExpression(node.args[1], context);

    const type = fn.value.inferOutputType([arg1.type, arg2.type]);
    if (!type) {
      throw new Error(
        `Infix function ${node.op} does not support arguments of type ${arg1.type.display()} and ${arg2.type.display()}`
      );
    }

    return new NodeInfixCall(node.location, node.op, [arg1, arg2], type);
  }
}
