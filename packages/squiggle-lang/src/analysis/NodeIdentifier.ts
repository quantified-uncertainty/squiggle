import { KindNode, LocationRange } from "../ast/types.js";
import { ICompileError } from "../errors/IError.js";
import { getValueType } from "../types/helpers.js";
import { Type } from "../types/Type.js";
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
    public resolved: ResolvedIdentifier,
    type: Type
  ) {
    super("Identifier", location, type);
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

    if (definition) {
      return new NodeIdentifier(
        node.location,
        node.value,
        {
          kind: "definition",
          node: definition,
        },
        definition.type
      );
    } else {
      const builtin = context.stdlib.get(node.value);
      if (!builtin) {
        throw new ICompileError(`${node.value} is not defined`, node.location);
      }
      return new NodeIdentifier(
        node.location,
        node.value,
        {
          kind: "builtin",
        },
        getValueType(builtin)
      );
    }
  }

  // useful for decorators which always point to builtins, `foo` resolves to `Tag.foo`
  static decoratorName(
    node: KindNode<"Identifier">,
    context: AnalysisContext
  ): NodeIdentifier {
    const builtin = context.stdlib.get(`Tag.${node.value}`);
    if (!builtin) {
      throw new ICompileError(`@${node.value} is not defined`, node.location);
    }
    return new NodeIdentifier(
      node.location,
      node.value,
      { kind: "builtin" },
      getValueType(builtin)
    );
  }
}
