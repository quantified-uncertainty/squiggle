import { KindNode, LocationRange } from "../ast/types.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression, analyzeStatement } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { AnyTypedExpressionNode, AnyTypedStatementNode } from "./types.js";

export class NodeBlock extends ExpressionNode<"Block"> {
  private constructor(
    location: LocationRange,
    public statements: AnyTypedStatementNode[],
    public result: AnyTypedExpressionNode
  ) {
    super("Block", location, result.type);
    this._init();
  }

  children() {
    return [...this.statements, this.result];
  }

  static fromAst(node: KindNode<"Block">, context: AnalysisContext): NodeBlock {
    // snapshot definitions - we won't store them since they're local
    const definitions = context.definitions;

    const statements: AnyTypedStatementNode[] = [];
    for (const statement of node.statements) {
      const typedStatement = analyzeStatement(statement, context);
      statements.push(typedStatement);

      // we're modifying context here but will refert `context.definitions` when the block is processed
      context.definitions = context.definitions.set(
        typedStatement.variable.value,
        typedStatement.variable
      );
    }

    const result = analyzeExpression(node.result, context);

    context.definitions = definitions;
    return new NodeBlock(node.location, statements, result);
  }
}
