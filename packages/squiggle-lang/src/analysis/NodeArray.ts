import { KindNode, LocationRange } from "../ast/types.js";
import { frAny, frArray } from "../library/registry/frTypes.js";
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
      frArray(frAny())
    );
  }

  static fromAst(node: KindNode<"Array">, context: AnalysisContext): NodeArray {
    return new NodeArray(
      node.location,
      node.elements.map((element) => analyzeExpression(element, context))
    );
  }
}
