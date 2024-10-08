import { AST } from "../ast/types.js";
import { Bindings } from "../reducer/Stack.js";
import { ImmutableMap } from "../utility/immutable.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression, analyzeStatement } from "./index.js";
import { Node } from "./Node.js";
import { NodeImport } from "./NodeImport.js";
import { AnyTypedExpressionNode, AnyTypedStatementNode } from "./types.js";

export class NodeProgram extends Node<"Program"> {
  private constructor(
    public raw: AST,
    public imports: NodeImport[],
    public statements: AnyTypedStatementNode[],
    public result: AnyTypedExpressionNode | null
  ) {
    super("Program", raw.location);
    this._init();
  }

  children() {
    return [
      ...this.imports,
      this.statements,
      this.result ? [this.result] : [],
    ].flat();
  }

  get comments() {
    return this.raw.comments;
  }

  // Var name -> statement node, for faster path resolution.
  // Not used for evaluation.
  private _symbols: Record<string, AnyTypedStatementNode> | undefined;
  get symbols(): Record<string, AnyTypedStatementNode> {
    if (!this._symbols) {
      this._symbols = {};
      for (const statement of this.statements) {
        this._symbols[statement.variable.value] = statement;
      }
    }
    return this._symbols;
  }

  static fromAst(ast: AST, stdlib: Bindings): NodeProgram {
    const context: AnalysisContext = {
      definitions: ImmutableMap(),
      stdlib,
    };

    const imports: NodeImport[] = [];

    for (const importNode of ast.imports) {
      const typedImportNode = NodeImport.fromAst(importNode);
      context.definitions = context.definitions.set(
        typedImportNode.variable.value,
        typedImportNode.variable
      );
      imports.push(typedImportNode);
    }

    const statements: AnyTypedStatementNode[] = [];
    for (const statement of ast.statements) {
      const typedStatement = analyzeStatement(statement, context);
      statements.push(typedStatement);
      context.definitions = context.definitions.set(
        typedStatement.variable.value,
        typedStatement.variable
      );
    }

    const result = ast.result ? analyzeExpression(ast.result, context) : null;

    return new NodeProgram(ast, imports, statements, result);
  }
}
