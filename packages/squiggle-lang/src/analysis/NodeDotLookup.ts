import { KindNode, LocationRange } from "../ast/types.js";
import { ICompileError } from "../errors/IError.js";
import { TDict } from "../types/TDict.js";
import { TDictWithArbitraryKeys } from "../types/TDictWithArbitraryKeys.js";
import { tAny, Type } from "../types/Type.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { AnyTypedExpressionNode } from "./types.js";

export class NodeDotLookup extends ExpressionNode<"DotLookup"> {
  private constructor(
    location: LocationRange,
    public arg: AnyTypedExpressionNode,
    public key: string
  ) {
    let type: Type;
    if (arg.type instanceof TDict) {
      const valueType = arg.type.valueType(key);
      if (!valueType) {
        throw new ICompileError(
          `Key ${key} doesn't exist in dict ${arg.type.display()}`,
          location
        );
      }
      type = valueType;
    } else if (arg.type instanceof TDictWithArbitraryKeys) {
      type = arg.type.itemType;
    } else {
      // TODO - some other value types can be indexed by a string too
      type = tAny();
    }

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
    return new NodeDotLookup(
      node.location,
      analyzeExpression(node.arg, context),
      node.key
    );
  }
}
