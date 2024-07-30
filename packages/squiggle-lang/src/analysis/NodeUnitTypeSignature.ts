import { KindNode, LocationRange } from "../ast/types.js";
import { AnalysisContext } from "./context.js";
import { analyzeUnitType } from "./index.js";
import { Node } from "./Node.js";
import { AnyUnitTypeNode } from "./types.js";

export class NodeUnitTypeSignature extends Node<"UnitTypeSignature"> {
  private constructor(
    location: LocationRange,
    public body: AnyUnitTypeNode
  ) {
    super("UnitTypeSignature", location);
    this._init();
  }

  children() {
    return [this.body];
  }

  static fromAst(
    node: KindNode<"UnitTypeSignature">,
    context: AnalysisContext
  ): NodeUnitTypeSignature {
    return new NodeUnitTypeSignature(
      node.location,
      analyzeUnitType(node.body, context)
    );
  }
}
