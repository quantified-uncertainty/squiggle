import { KindNode, LocationRange } from "../ast/types.js";
import { frAny } from "../library/registry/frTypes.js";
import { AnalysisContext } from "./context.js";
import { ExpressionNode } from "./Node.js";
import { NodeIdentifierDefinition } from "./NodeIdentifierDefinition.js";

type ResolvedIdentifier =
  | {
      kind: "definition";
      node: NodeIdentifierDefinition;
    }
  | {
      kind: "builtin";
      // TODO - point to the specific builtin (this will require access to stdlib during analysis stage)
    };

export class NodeIdentifier extends ExpressionNode<"Identifier"> {
  private constructor(
    location: LocationRange,
    public value: string,
    public resolved: ResolvedIdentifier
  ) {
    super(
      "Identifier",
      location,
      frAny() // TODO - from definition
    );
    this._init();
  }

  children() {
    return [];
  }

  static fromAst(
    node: KindNode<"Identifier">,
    context: AnalysisContext
  ): NodeIdentifier {
    const definition = context.definitions.get(node.value);
    const resolved: ResolvedIdentifier = definition
      ? { kind: "definition", node: definition }
      : { kind: "builtin" };

    return new NodeIdentifier(node.location, node.value, resolved);
  }

  // useful for decorators which always point to builtins, `foo` resolves to `Tag.foo`
  static decoratorName(node: KindNode<"Identifier">): NodeIdentifier {
    return new NodeIdentifier(node.location, node.value, { kind: "builtin" });
  }
}
