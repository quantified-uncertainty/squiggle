import { KindNode, LocationRange } from "../ast/types.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression } from "./index.js";
import { Node } from "./Node.js";
import { NodeIdentifier } from "./NodeIdentifier.js";
import { AnyExpressionNode } from "./types.js";

export class NodeDecorator extends Node<"Decorator"> {
  private constructor(
    location: LocationRange,
    public name: NodeIdentifier,
    public args: AnyExpressionNode[]
  ) {
    super("Decorator", location);
  }

  static fromAst(
    node: KindNode<"Decorator">,
    context: AnalysisContext
  ): NodeDecorator {
    // decorator names never refer to user-defined variables, so we always resolve them to `Tag.*` builtins
    const name = NodeIdentifier.decoratorName(node.name);

    const args = node.args.map((arg) => analyzeExpression(arg, context));

    return new NodeDecorator(node.location, name, args);
  }
}
