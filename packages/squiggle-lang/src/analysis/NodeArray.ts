import { KindNode, LocationRange } from "../ast/types.js";
import { makeUnionAndSimplify } from "../types/helpers.js";
import { tAny, tArray } from "../types/index.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { AnyTypedExpressionNode } from "./types.js";

export class NodeArray extends ExpressionNode<"Array"> {
  private constructor(
    location: LocationRange,
    public elements: AnyTypedExpressionNode[]
  ) {
    super(
      "Array",
      location,
      tArray(
        elements.length
          ? makeUnionAndSimplify(elements.map((element) => element.type))
          : tAny()
      )
    );
    this._init();
  }

  children() {
    return this.elements;
  }

  static fromAst(node: KindNode<"Array">, context: AnalysisContext): NodeArray {
    const elements = node.elements.map((element) =>
      analyzeExpression(element, context)
    );

    return new NodeArray(node.location, elements);
  }
}
