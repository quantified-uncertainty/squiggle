import { KindNode, LocationRange } from "../ast/types.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression, analyzeKind } from "./index.js";
import { Node } from "./Node.js";
import { NodeDecorator } from "./NodeDecorator.js";
import { NodeIdentifierDefinition } from "./NodeIdentifierDefinition.js";
import { NodeUnitTypeSignature } from "./NodeUnitTypeSignature.js";
import { AnyExpressionNode } from "./types.js";

export type LetOrDefun = {
  decorators: NodeDecorator[];
  exported: boolean;
  variable: NodeIdentifierDefinition;
};

export class NodeLetStatement
  extends Node<"LetStatement">
  implements LetOrDefun
{
  private constructor(
    location: LocationRange,
    public decorators: NodeDecorator[],
    public exported: boolean,
    public variable: NodeIdentifierDefinition,
    public unitTypeSignature: NodeUnitTypeSignature | null,
    public value: AnyExpressionNode
  ) {
    super("LetStatement", location);
    this._init();
  }

  children() {
    return [
      ...this.decorators,
      this.variable,
      ...(this.unitTypeSignature ? [this.unitTypeSignature] : []),
      this.value,
    ];
  }

  static fromAst(node: KindNode<"LetStatement">, context: AnalysisContext) {
    const value = analyzeExpression(node.value, context);
    const decorators = node.decorators.map((decorator) =>
      analyzeKind(decorator, "Decorator", context)
    );

    return new NodeLetStatement(
      node.location,
      decorators,
      node.exported,
      NodeIdentifierDefinition.fromAst(node.variable, value.type),
      node.unitTypeSignature
        ? analyzeKind(node.unitTypeSignature, "UnitTypeSignature", context)
        : null,
      value
    );
  }
}
