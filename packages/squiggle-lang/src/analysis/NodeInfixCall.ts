import { infixFunctions } from "../ast/operators.js";
import { InfixOperator, KindNode, LocationRange } from "../ast/types.js";
import { ICompileError } from "../errors/IError.js";
import { inferOutputTypeByLambda } from "../types/helpers.js";
import { Type } from "../types/Type.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { AnyTypedExpressionNode } from "./types.js";

export class NodeInfixCall extends ExpressionNode<"InfixCall"> {
  private constructor(
    location: LocationRange,
    public op: InfixOperator,
    public args: [AnyTypedExpressionNode, AnyTypedExpressionNode],
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
      // shouldn't happen with the default stdlib in context and the correct peggy grammar
      throw new ICompileError(
        `Internal error: Infix function not found: '${node.op}'`,
        node.location
      );
    }
    if (fn.type !== "Lambda") {
      throw new ICompileError(
        `Internal error: Expected infix function to be a function`,
        node.location
      );
    }

    const arg1 = analyzeExpression(node.args[0], context);
    const arg2 = analyzeExpression(node.args[1], context);

    const type = inferOutputTypeByLambda(fn.value, [arg1.type, arg2.type]);
    if (!type) {
      throw new ICompileError(
        `Operator '${node.op}' does not support types '${arg1.type.display()}' and '${arg2.type.display()}'`,
        node.location
      );
    }

    return new NodeInfixCall(node.location, node.op, [arg1, arg2], type);
  }
}
