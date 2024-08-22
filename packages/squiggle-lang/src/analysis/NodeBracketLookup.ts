import { KindNode, LocationRange } from "../ast/types.js";
import { tAny } from "../types/index.js";
import { TArray } from "../types/TArray.js";
import { TDictWithArbitraryKeys } from "../types/TDictWithArbitraryKeys.js";
import { Type } from "../types/Type.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { inferDotLookup } from "./NodeDotLookup.js";
import { AnyTypedExpressionNode } from "./types.js";

export class NodeBracketLookup extends ExpressionNode<"BracketLookup"> {
  private constructor(
    location: LocationRange,
    public arg: AnyTypedExpressionNode,
    public key: AnyTypedExpressionNode,
    type: Type
  ) {
    super("BracketLookup", location, type);
    this._init();
  }

  children() {
    return [this.arg, this.key];
  }

  static fromAst(
    node: KindNode<"BracketLookup">,
    context: AnalysisContext
  ): NodeBracketLookup {
    const arg = analyzeExpression(node.arg, context);
    const key = analyzeExpression(node.key, context);

    let type: Type | undefined;
    if (key.kind === "String") {
      // same as dot lookup
      type = inferDotLookup(node.location, arg, key.value);
    } else if (arg.type instanceof TDictWithArbitraryKeys) {
      type = arg.type.itemType;
    } else if (key.kind === "Float" && arg.type instanceof TArray) {
      type = arg.type.itemType;
    } else {
      // TODO - support other node types, e.g. `fn.parameters` and other values that implement `Indexable`
      // TODO - throw when lookup is not supported
      type = tAny();
    }

    return new NodeBracketLookup(node.location, arg, key, type);
  }
}
