import { AST, ASTNode } from "../ast/types.js";
import { ICompileError } from "../errors/IError.js";
import { getStdLib } from "../library/index.js";
import { Bindings } from "../reducer/Stack.js";
import { Err, Ok, result } from "../utility/result.js";
import { AnalysisContext } from "./context.js";
import { NodeArray } from "./NodeArray.js";
import { NodeBlock } from "./NodeBlock.js";
import { NodeBoolean } from "./NodeBoolean.js";
import { NodeBracketLookup } from "./NodeBracketLookup.js";
import { NodeCall } from "./NodeCall.js";
import { NodeDecorator } from "./NodeDecorator.js";
import { NodeDefunStatement } from "./NodeDefunStatement.js";
import { NodeDict } from "./NodeDict.js";
import { NodeDotLookup } from "./NodeDotLookup.js";
import { NodeExponentialUnitType } from "./NodeExponentialUnitType.js";
import { NodeFloat } from "./NodeFloat.js";
import { NodeIdentifier } from "./NodeIdentifier.js";
import { NodeImport } from "./NodeImport.js";
import { NodeInfixCall } from "./NodeInfixCall.js";
import { NodeInfixUnitType } from "./NodeInfixUnitType.js";
import { NodeKeyValue } from "./NodeKeyValue.js";
import { NodeLambda } from "./NodeLambda.js";
import { NodeLambdaParameter } from "./NodeLambdaParameter.js";
import { NodeLetStatement } from "./NodeLetStatement.js";
import { NodePipe } from "./NodePipe.js";
import { NodeProgram } from "./NodeProgram.js";
import { NodeString } from "./NodeString.js";
import { NodeTernary } from "./NodeTernary.js";
import { NodeUnaryCall } from "./NodeUnaryCall.js";
import { NodeUnitTypeSignature } from "./NodeUnitTypeSignature.js";
import { NodeUnitValue } from "./NodeUnitValue.js";
import {
  AnyTypedExpressionNode,
  AnyTypedStatementNode,
  AnyTypedUnitTypeNode,
  expressionKinds,
  KindTypedNode,
  statementKinds,
  TypedAST,
  TypedASTNode,
  unitTypeKinds,
} from "./types.js";
import { unitTypeCheck } from "./unitTypeChecker.js";

function assertKind<Kind extends TypedASTNode["kind"]>(
  node: TypedASTNode,
  kind: Kind
): asserts node is KindTypedNode<Kind> {
  if (node.kind !== kind) {
    // shouldn't happen if Peggy grammar is correct
    throw new ICompileError(
      `Internal error: Expected ${kind}, got ${node.kind}`,
      node.location
    );
  }
}

function assertOneOfKinds<Kind extends TypedASTNode["kind"]>(
  node: TypedASTNode,
  kinds: readonly Kind[],
  kindsName?: string
): asserts node is KindTypedNode<Kind> {
  if (!(kinds as readonly string[]).includes(node.kind)) {
    // shouldn't happen if Peggy grammar is correct
    throw new ICompileError(
      `Internal error: Expected ${kindsName ?? kinds.join("|")}, got ${node.kind}`,
      node.location
    );
  }
}

function assertStatement(
  node: TypedASTNode
): asserts node is AnyTypedStatementNode {
  assertOneOfKinds(node, statementKinds, "statement");
}

function assertExpression(
  node: TypedASTNode
): asserts node is AnyTypedExpressionNode {
  assertOneOfKinds(node, expressionKinds, "expression");
}

function assertUnitType(
  node: TypedASTNode
): asserts node is AnyTypedUnitTypeNode {
  assertOneOfKinds(node, unitTypeKinds, "unit type");
}

export function analyzeKind<Kind extends TypedASTNode["kind"]>(
  node: ASTNode,
  kind: Kind,
  context: AnalysisContext
): KindTypedNode<Kind> {
  const typedNode = analyzeAstNode(node, context);
  assertKind(typedNode, kind);
  return typedNode;
}

export function analyzeOneOfKinds<Kind extends TypedASTNode["kind"]>(
  node: ASTNode,
  kinds: Kind[],
  context: AnalysisContext
): KindTypedNode<Kind> {
  const typedNode = analyzeAstNode(node, context);
  assertOneOfKinds(typedNode, kinds);
  return typedNode;
}

export function analyzeExpression(
  node: ASTNode,
  context: AnalysisContext
): AnyTypedExpressionNode {
  const typedNode = analyzeAstNode(node, context);
  assertExpression(typedNode);
  return typedNode;
}

export function analyzeUnitType(
  node: ASTNode,
  context: AnalysisContext
): AnyTypedUnitTypeNode {
  const typedNode = analyzeAstNode(node, context);
  assertUnitType(typedNode);
  return typedNode;
}

export function analyzeStatement(
  node: ASTNode,
  symbols: AnalysisContext
): AnyTypedStatementNode {
  const typedNode = analyzeAstNode(node, symbols);
  assertStatement(typedNode);
  return typedNode;
}

function analyzeAstNode(node: ASTNode, context: AnalysisContext): TypedASTNode {
  switch (node.kind) {
    case "Program":
      // shouldn't happen if Peggy grammar is correct
      throw new ICompileError(
        "Encountered a nested Program node",
        node.location
      );
    case "Import":
      return NodeImport.fromAst(node);
    case "Block":
      return NodeBlock.fromAst(node, context);
    case "LetStatement":
      return NodeLetStatement.fromAst(node, context);
    case "Decorator":
      return NodeDecorator.fromAst(node, context);
    case "DefunStatement":
      return NodeDefunStatement.fromAst(node, context);
    case "Lambda":
      return NodeLambda.fromAst(node, context);
    case "LambdaParameter":
      return NodeLambdaParameter.fromAst(node, context);
    case "Identifier":
      return NodeIdentifier.fromAst(node, context);
    case "String":
      return NodeString.fromAst(node);
    case "Float":
      return NodeFloat.fromAst(node);
    case "Boolean":
      return NodeBoolean.fromAst(node);
    case "Array":
      return NodeArray.fromAst(node, context);
    case "Dict":
      return NodeDict.fromAst(node, context);
    case "KeyValue":
      return NodeKeyValue.fromAst(node, context);
    case "UnitValue":
      return NodeUnitValue.fromAst(node, context);
    case "Call":
      return NodeCall.fromAst(node, context);
    case "InfixCall":
      return NodeInfixCall.fromAst(node, context);
    case "UnaryCall":
      return NodeUnaryCall.fromAst(node, context);
    case "Pipe":
      return NodePipe.fromAst(node, context);
    case "BracketLookup":
      return NodeBracketLookup.fromAst(node, context);
    case "DotLookup":
      return NodeDotLookup.fromAst(node, context);
    case "Ternary":
      return NodeTernary.fromAst(node, context);
    case "UnitTypeSignature":
      return NodeUnitTypeSignature.fromAst(node, context);
    case "InfixUnitType":
      return NodeInfixUnitType.fromAst(node, context);
    case "ExponentialUnitType":
      return NodeExponentialUnitType.fromAst(node, context);
    default:
      return node satisfies never;
  }
}

export function analyzeAst(
  ast: AST,
  builtins?: Bindings
): result<TypedAST, ICompileError> {
  try {
    // TODO - adapt this code to new type checking
    unitTypeCheck(ast);

    return Ok(NodeProgram.fromAst(ast, builtins ?? getStdLib()));
  } catch (e) {
    if (e instanceof ICompileError) {
      return Err(e);
    } else {
      return Err(new ICompileError(String(e), ast.location));
    }
  }
}
