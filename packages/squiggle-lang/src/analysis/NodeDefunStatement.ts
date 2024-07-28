import { KindNode, LocationRange } from "../ast/types.js";
import { AnalysisContext } from "./context.js";
import { analyzeKind } from "./index.js";
import { Node } from "./Node.js";
import { NodeDecorator } from "./NodeDecorator.js";
import { NodeIdentifierDefinition } from "./NodeIdentifierDefinition.js";
import { NodeLambda } from "./NodeLambda.js";
import { LetOrDefun } from "./NodeLetStatement.js";

export class NodeDefunStatement
  extends Node<"DefunStatement">
  implements LetOrDefun
{
  private constructor(
    location: LocationRange,
    public decorators: NodeDecorator[],
    public exported: boolean,
    public variable: NodeIdentifierDefinition,
    public value: NodeLambda
  ) {
    super("DefunStatement", location);
  }

  static fromAst(
    node: KindNode<"DefunStatement">,
    context: AnalysisContext
  ): NodeDefunStatement {
    const decorators = node.decorators.map((decorator) =>
      analyzeKind(decorator, "Decorator", context)
    );
    const value = analyzeKind(node.value, "Lambda", context);

    return new NodeDefunStatement(
      node.location,
      decorators,
      node.exported,
      NodeIdentifierDefinition.fromAst(node.variable),
      value
    );
  }
}
