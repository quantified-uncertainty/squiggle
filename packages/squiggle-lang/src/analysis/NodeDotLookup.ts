import { KindNode, LocationRange } from "../ast/types.js";
import { tAny } from "../types/TAny.js";
import { TDict } from "../types/TDict.js";
import { TDictWithArbitraryKeys } from "../types/TDictWithArbitraryKeys.js";
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
    const type =
      arg.type instanceof TDict
        ? arg.type.valueType(key) ?? tAny()
        : arg.type instanceof TDictWithArbitraryKeys
          ? arg.type.itemType
          : tAny();

    // TODO - some other value types can be indexed by a string too

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
