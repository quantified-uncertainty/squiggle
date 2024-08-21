import { KindNode, LocationRange } from "../ast/types.js";
import { ICompileError } from "../errors/IError.js";
import { ErrorMessage } from "../errors/messages.js";
import { inferOutputTypeByMultipleSignatures } from "../types/helpers.js";
import { TIntrinsic } from "../types/TIntrinsic.js";
import { TTypedLambda } from "../types/TTypedLambda.js";
import { TUnion } from "../types/TUnion.js";
import { tAny, TAny, Type } from "../types/Type.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { AnyTypedExpressionNode } from "./types.js";

export class NodeCall extends ExpressionNode<"Call"> {
  private constructor(
    location: LocationRange,
    public fn: AnyTypedExpressionNode,
    public args: AnyTypedExpressionNode[],
    type: Type<unknown>
  ) {
    super("Call", location, type);
    this._init();
  }

  children() {
    return [this.fn, ...this.args];
  }

  static fromAst(node: KindNode<"Call">, context: AnalysisContext): NodeCall {
    const fn = analyzeExpression(node.fn, context);
    const args = node.args.map((arg) => analyzeExpression(arg, context));

    let type: Type | undefined;
    const signatures: TTypedLambda[] = [];

    const collectSignatures = (fnType: Type) => {
      if (type) {
        // already settled on `any`
        return;
      }

      if (fnType instanceof TUnion) {
        for (const singleFnType of fnType.types) {
          collectSignatures(singleFnType);
          if (type) {
            // already settled on `any`
            break;
          }
        }
      } else if (fnType instanceof TTypedLambda) {
        signatures.push(fnType);
      } else if (
        fnType instanceof TIntrinsic &&
        fnType.valueType === "Lambda"
      ) {
        type = tAny();
      } else if (
        fnType instanceof TAny ||
        (fnType instanceof TIntrinsic && fnType.valueType === "Lambda")
      ) {
        type = tAny();
      } else {
        throw new ICompileError(
          ErrorMessage.typeIsNotAFunctionError(fnType).toString(),
          node.location
        );
      }
    };
    collectSignatures(fn.type);

    if (!type) {
      const inferResult = inferOutputTypeByMultipleSignatures(
        signatures,
        args.map((a) => a.type)
      );

      switch (inferResult.kind) {
        case "ok":
          type = inferResult.type;
          break;
        case "arity":
          throw new ICompileError(
            ErrorMessage.arityError(inferResult.arity, args.length).toString(),
            node.location
          );
        case "no-match":
          throw new ICompileError(
            ErrorMessage.callSignatureMismatchError(
              fn,
              args.map((a) => a.type)
            ).toString(),
            node.location
          );
      }
    }

    return new NodeCall(node.location, fn, args, type);
  }
}
