import { KindNode, LocationRange } from "../ast/types.js";
import { Node } from "./Node.js";

type Rank = "top" | "import" | "parameter" | "local";

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

  // unused method, but can be useful later
  get rank(): Rank {
    if (!this.parent) {
      throw new Error("IdentifierDefinition has no parent");
    }
    if (this.parent.kind === "LambdaParameter") {
      return "parameter";
    }
    if (this.parent.kind === "Import") {
      return "import";
    }
    // If the variable is not an import or a parameter, it's a name in Let or Defun statement.
    // Is it a top-level name or a local name?
    const statement = this.parent;
    if (statement.parent?.kind === "Program") {
      return "top";
    } else {
      return "local";
    }
  }
}
