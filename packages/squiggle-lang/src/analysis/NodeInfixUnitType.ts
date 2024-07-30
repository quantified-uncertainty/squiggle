import { KindNode, LocationRange, TypeOperator } from "../ast/types.js";
import { AnalysisContext } from "./context.js";
import { analyzeUnitType } from "./index.js";
import { Node } from "./Node.js";
import { AnyUnitTypeNode } from "./types.js";

export class NodeInfixUnitType extends Node<"InfixUnitType"> {
  constructor(
    location: LocationRange,
    public op: TypeOperator,
    public args: [AnyUnitTypeNode, AnyUnitTypeNode]
  ) {
    super("InfixUnitType", location);
    this._init();
  }

  children() {
    return this.args;
  }

  static fromAst(
    node: KindNode<"InfixUnitType">,
    context: AnalysisContext
  ): NodeInfixUnitType {
    return new NodeInfixUnitType(node.location, node.op, [
      analyzeUnitType(node.args[0], context),
      analyzeUnitType(node.args[1], context),
    ]);
  }
}
