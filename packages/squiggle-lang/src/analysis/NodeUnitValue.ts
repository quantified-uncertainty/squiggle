import { KindNode, LocationRange } from "../ast/types.js";
import { AnalysisContext } from "./context.js";
import { analyzeKind } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { NodeFloat } from "./NodeFloat.js";

export class NodeUnitValue extends ExpressionNode<"UnitValue"> {
  private constructor(
    location: LocationRange,
    public value: NodeFloat,
    public unit: string
  ) {
    super("UnitValue", location, value.type);
  }

  static fromAst(
    node: KindNode<"UnitValue">,
    context: AnalysisContext
  ): NodeUnitValue {
    return new NodeUnitValue(
      node.location,
      analyzeKind(node.value, "Float", context),
      node.unit
    );
  }
}
