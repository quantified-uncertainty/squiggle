import { KindNode, LocationRange } from "../ast/types.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression, analyzeKind } from "./index.js";
import { Node } from "./Node.js";
import { NodeIdentifierDefinition } from "./NodeIdentifierDefinition.js";
import { NodeUnitTypeSignature } from "./NodeUnitTypeSignature.js";
import { AnyExpressionNode, TypedASTNode } from "./types.js";

export class NodeLambdaParameter extends Node<"LambdaParameter"> {
  private constructor(
    location: LocationRange,
    public variable: NodeIdentifierDefinition,
    public annotation: AnyExpressionNode | null,
    public unitTypeSignature: NodeUnitTypeSignature | null
  ) {
    super("LambdaParameter", location);
    this._init();
  }

  children() {
    const result: TypedASTNode[] = [this.variable];
    if (this.annotation) result.push(this.annotation);
    if (this.unitTypeSignature) result.push(this.unitTypeSignature);
    return result;
  }

  static fromAst(node: KindNode<"LambdaParameter">, context: AnalysisContext) {
    return new NodeLambdaParameter(
      node.location,
      NodeIdentifierDefinition.fromAst(node.variable),
      node.annotation ? analyzeExpression(node.annotation, context) : null,
      node.unitTypeSignature
        ? analyzeKind(node.unitTypeSignature, "UnitTypeSignature", context)
        : null
    );
  }
}