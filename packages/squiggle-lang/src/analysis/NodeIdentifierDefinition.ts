import { KindNode, LocationRange } from "../ast/types.js";
import { Node } from "./Node.js";

// definitions are:
// `x` in `x = 5`
// `x` in `import "foo" as x`
// `x` in `f(x) = 5`
export class NodeIdentifierDefinition extends Node<"IdentifierDefinition"> {
  private constructor(
    location: LocationRange,
    public value: string
  ) {
    super("IdentifierDefinition", location);
    this._init();
  }

  children() {
    return [];
  }

  static fromAst(
    // Identifier definitions (e.g. `x` in `x = 5`) are represented as `Identifier` nodes in the AST,
    // but they are treated as a separate kind of node in the analysis phase.
    node: KindNode<"Identifier">
  ): NodeIdentifierDefinition {
    return new NodeIdentifierDefinition(node.location, node.value);
  }
}
