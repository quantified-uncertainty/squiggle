import { KindNode, LocationRange } from "../ast/types.js";
import { Node } from "./Node.js";

export class NodeUnitName extends Node<"UnitName"> {
  private constructor(
    location: LocationRange,
    public value: string
  ) {
    super("UnitName", location);
    this._init();
  }

  children() {
    return [];
  }

  static fromAst(node: KindNode<"UnitName">): NodeUnitName {
    return new NodeUnitName(node.location, node.value);
  }
}
