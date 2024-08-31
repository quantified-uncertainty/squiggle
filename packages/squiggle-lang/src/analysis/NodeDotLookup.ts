import { KindNode, LocationRange } from "../ast/types.js";
import { ICompileError } from "../errors/IError.js";
import { ErrorMessage } from "../errors/messages.js";
import { TDict } from "../types/TDict.js";
import { TDictWithArbitraryKeys } from "../types/TDictWithArbitraryKeys.js";
import { tAny, Type } from "../types/Type.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { AnyTypedExpressionNode } from "./types.js";

export function inferDotLookup(
  location: LocationRange,
  arg: AnyTypedExpressionNode,
  key: string
): Type {
  if (arg.type instanceof TDict) {
    const valueType = arg.type.valueType(key);
    if (!valueType) {
      throw new ICompileError(
        ErrorMessage.dictPropertyNotFoundCompileError(key, arg.type).toString(),
        location
      );
    }
    return valueType;
  } else if (arg.type instanceof TDictWithArbitraryKeys) {
    return arg.type.itemType;
  } else {
    // TODO - some other value types (values that implement `Indexable`) can be indexed by a string too
    return tAny();
  }
}

export class NodeDotLookup extends ExpressionNode<"DotLookup"> {
  private constructor(
    location: LocationRange,
    public arg: AnyTypedExpressionNode,
    public key: string,
    type: Type
  ) {
    super("DotLookup", location, type);
    this._init();
  }

  children() {
    return [this.arg];
  }

  static fromAst(
    node: KindNode<"DotLookup">,
    context: AnalysisContext
  ): NodeDotLookup {
    const arg = analyzeExpression(node.arg, context);
    const type = inferDotLookup(node.location, arg, node.key);

    return new NodeDotLookup(node.location, arg, node.key, type);
  }
}
