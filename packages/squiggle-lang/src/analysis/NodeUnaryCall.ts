import { unaryFunctions } from "../ast/operators.js";
import { KindNode, LocationRange, UnaryOperator } from "../ast/types.js";
import { ICompileError } from "../errors/IError.js";
import { inferLambdaOutputType } from "../types/helpers.js";
import { Type } from "../types/Type.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { AnyTypedExpressionNode } from "./types.js";

export class NodeUnaryCall extends ExpressionNode<"UnaryCall"> {
  private constructor(
    location: LocationRange,
    public op: UnaryOperator,
    public arg: AnyTypedExpressionNode,
    type: Type
  ) {
    super("UnaryCall", location, type);
    this._init();
  }

  children() {
    return [this.arg];
  }

  static fromAst(
    node: KindNode<"UnaryCall">,
    context: AnalysisContext
  ): NodeUnaryCall {
    const fn = context.stdlib.get(unaryFunctions[node.op]);
    if (!fn) {
      // shouldn't happen with the default stdlib in context and the correct peggy grammar
      throw new ICompileError(
        `Internal error: Unary function not found: '${node.op}'`,
        node.location
      );
    }
    if (fn.type !== "Lambda") {
      throw new ICompileError(
        `Internal error: Expected unary function to be a function`,
        node.location
      );
    }

    const arg = analyzeExpression(node.arg, context);

    const type = inferLambdaOutputType(fn.value, [arg.type]);
    if (!type) {
      throw new ICompileError(
        `Operator '${node.op}' does not support type '${arg.type.display()}'`,
        node.location
      );
    }

    return new NodeUnaryCall(
      node.location,
      node.op,
      analyzeExpression(node.arg, context),
      type
    );
  }
}
