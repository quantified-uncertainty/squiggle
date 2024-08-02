import { KindNode, LocationRange } from "../ast/types.js";
import { tAny, tArray } from "../types/index.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { AnyExpressionNode } from "./types.js";

export class NodeArray extends ExpressionNode<"Array"> {
  private constructor(
    location: LocationRange,
    public elements: AnyExpressionNode[]
  ) {
    super(
      "Array",
      location,
      // TODO - get the type from the elements
      tArray(tAny())
    );
    this._init();
  }

  children() {
    return this.elements;
  }

  static fromAst(node: KindNode<"Array">, context: AnalysisContext): NodeArray {
    return new NodeArray(
      node.location,
      node.elements.map((element) => analyzeExpression(element, context))
    );
  }
}
