import { KindNode, LocationRange } from "../ast/types.js";
import { tAny } from "../types/TAny.js";
import { Node } from "./Node.js";
import { NodeIdentifierDefinition } from "./NodeIdentifierDefinition.js";
import { NodeString } from "./NodeString.js";

export class NodeImport extends Node<"Import"> {
  private constructor(
    location: LocationRange,
    public path: NodeString,
    public variable: NodeIdentifierDefinition
  ) {
    super("Import", location);
    this._init();
  }

  children() {
    return [this.path, this.variable];
  }

  static fromAst(node: KindNode<"Import">): NodeImport {
    const path = NodeString.fromAst(node.path);
    const variable = NodeIdentifierDefinition.fromAst(
      node.variable,
      tAny() // TODO - infer from import data
    );
    return new NodeImport(node.location, path, variable);
  }
}
