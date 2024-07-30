import { AST } from "../ast/types.js";
import { ImmutableMap } from "../utility/immutable.js";
import { AnalysisContext } from "./context.js";
import { analyzeExpression, analyzeKind, analyzeStatement } from "./index.js";
import { Node } from "./Node.js";
import { NodeIdentifierDefinition } from "./NodeIdentifierDefinition.js";
import { NodeString } from "./NodeString.js";
import { AnyExpressionNode, AnyStatementNode, KindTypedNode } from "./types.js";

export class NodeProgram extends Node<"Program"> {
  private constructor(
    public raw: AST,
    public imports: [NodeString, NodeIdentifierDefinition][],
    public statements: AnyStatementNode[],
    public result: AnyExpressionNode | null
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
  private _symbols: Record<string, AnyStatementNode> | undefined;
  get symbols(): Record<string, AnyStatementNode> {
    if (!this._symbols) {
      this._symbols = {};
      for (const statement of this.statements) {
        this._symbols[statement.variable.value] = statement;
      }
    }
    return this._symbols;
  }

  static fromAst(ast: AST): NodeProgram {
    const context: AnalysisContext = {
      definitions: ImmutableMap(),
    };

    const imports: [
      KindTypedNode<"String">,
      KindTypedNode<"IdentifierDefinition">,
    ][] = [];

    for (const [path, alias] of ast.imports) {
      const typedPath = analyzeKind(path, "String", context);
      const typedAlias = NodeIdentifierDefinition.fromAst(alias);
      context.definitions = context.definitions.set(
        typedAlias.value,
        typedAlias
      );
      imports.push([typedPath, typedAlias]);
    }

    const statements: AnyStatementNode[] = [];
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
