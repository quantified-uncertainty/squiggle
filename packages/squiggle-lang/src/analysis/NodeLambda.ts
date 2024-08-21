import { KindNode, LocationRange } from "../ast/types.js";
import { namedInput } from "../reducer/lambda/FnInput.js";
import { tAny, tTypedLambda } from "../types/index.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression, analyzeKind } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { NodeLambdaParameter } from "./NodeLambdaParameter.js";
import { NodeUnitTypeSignature } from "./NodeUnitTypeSignature.js";
import { AnyTypedExpressionNode } from "./types.js";

export class NodeLambda extends ExpressionNode<"Lambda"> {
  private constructor(
    location: LocationRange,
    public parameters: NodeLambdaParameter[],
    public body: AnyTypedExpressionNode,
    public name: string | null,
    public returnUnitType: NodeUnitTypeSignature | null
  ) {
    super(
      "Lambda",
      location,
      tTypedLambda(
        parameters.map((arg) =>
          namedInput(
            arg.variable.value,
            tAny() // TODO - infer from parameter annotation
          )
        ),
        body.type
      )
    );
    this._init();
  }

  children() {
    return [
      ...this.parameters,
      this.body,
      ...(this.returnUnitType ? [this.returnUnitType] : []),
    ];
  }

  static fromAst(
    node: KindNode<"Lambda">,
    context: AnalysisContext
  ): NodeLambda {
    const definitions = context.definitions;

    const parameters = node.args.map((arg) =>
      analyzeKind(arg, "LambdaParameter", context)
    );
    for (const parameter of parameters) {
      context.definitions = context.definitions.set(
        parameter.variable.value,
        parameter.variable
      );
    }
    const body = analyzeExpression(node.body, context);

    // revert definitions
    context.definitions = definitions;

    return new NodeLambda(
      node.location,
      parameters,
      body,
      node.name,
      node.returnUnitType
        ? analyzeKind(node.returnUnitType, "UnitTypeSignature", context)
        : null
    );
  }
}
