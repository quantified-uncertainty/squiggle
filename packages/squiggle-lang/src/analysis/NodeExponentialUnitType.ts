import { KindNode, LocationRange } from "../ast/types.js";
import { AnalysisContext } from "./context.js";
import { analyzeKind, analyzeUnitType } from "./index.js";
import { Node } from "./Node.js";
import { NodeFloat } from "./NodeFloat.js";
import { AnyUnitTypeNode } from "./types.js";

export class NodeExponentialUnitType extends Node<"ExponentialUnitType"> {
  private constructor(
    location: LocationRange,
    public base: AnyUnitTypeNode,
    public exponent: NodeFloat
  ) {
    super("ExponentialUnitType", location);
    this._init();
  }

  children() {
    return [this.base, this.exponent];
  }

  static fromAst(
    node: KindNode<"ExponentialUnitType">,
    context: AnalysisContext
  ): NodeExponentialUnitType {
    return new NodeExponentialUnitType(
      node.location,
      analyzeUnitType(node.base, context),
      analyzeKind(node.exponent, "Float", context)
    );
  }
}
