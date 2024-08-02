import { KindNode, LocationRange } from "../ast/types.js";
import { tAny } from "../types/index.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression, analyzeKind } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { NodeLambdaParameter } from "./NodeLambdaParameter.js";
import { NodeUnitTypeSignature } from "./NodeUnitTypeSignature.js";
import { AnyExpressionNode } from "./types.js";

export class NodeLambda extends ExpressionNode<"Lambda"> {
  private constructor(
    location: LocationRange,
    public args: NodeLambdaParameter[],
    public body: AnyExpressionNode,
    public name: string | null,
    public returnUnitType: NodeUnitTypeSignature | null
  ) {
    super(
      "Lambda",
      location,
      tAny() // TODO - lambda type
    );
    this._init();
  }

  children() {
    return [
      ...this.args,
      this.body,
      ...(this.returnUnitType ? [this.returnUnitType] : []),
    ];
  }

  static fromAst(
    node: KindNode<"Lambda">,
    context: AnalysisContext
  ): NodeLambda {
    const definitions = context.definitions;

    const args = node.args.map((arg) =>
      analyzeKind(arg, "LambdaParameter", context)
    );
    for (const arg of args) {
      context.definitions = context.definitions.set(
        arg.variable.value,
        arg.variable
      );
    }
    const body = analyzeExpression(node.body, context);

    // revert definitions
    context.definitions = definitions;

    return new NodeLambda(
      node.location,
      args,
      body,
      node.name,
      node.returnUnitType
        ? analyzeKind(node.returnUnitType, "UnitTypeSignature", context)
        : null
    );
  }
}
