import {
  AST,
  InfixOperator,
  LocationRange,
  TypeOperator,
  UnaryOperator,
} from "../ast/types.js";
import { FRType } from "../library/registry/frTypes.js";

type SymbolEntry = {
  name: string;
};

export type SymbolTable = SymbolEntry[];

type Node<T extends string, V extends object> = {
  kind: T;
  location: LocationRange;
} & V;

type ExpressionNode<T extends string, V extends object> = Node<T, V> & {
  type: FRType<any>;
};

/*
 * Specific `Node*` types are mostly not exported, because they're easy to
 * obtain with `KindNode<"Name">` helper.
 */

type NodeProgram = Node<
  "Program",
  {
    imports: readonly [NodeString, NodeIdentifier][];
    statements: AnyStatementNode[];
    result: AnyExpressionNode | null;
    // Var name -> statement node, for faster path resolution.
    // Not used for evaluation.
    // Note: symbols point to undecorated statements.
    symbols: { [k in string]: AnyStatementNode };
  }
>;

type NodeBlock = ExpressionNode<
  "Block",
  {
    statements: AnyStatementNode[];
    result: AnyExpressionNode;
  }
>;

type NodeArray = ExpressionNode<
  "Array",
  {
    elements: AnyExpressionNode[];
  }
>;

type NodeDict = ExpressionNode<
  "Dict",
  {
    elements: AnyDictEntryNode[];
    // Static key -> node, for faster path resolution.
    // Not used for evaluation.
    symbols: { [k in number | string]: AnyDictEntryNode };
  }
>;
type NodeKeyValue = Node<
  "KeyValue",
  {
    key: AnyExpressionNode;
    value: AnyExpressionNode;
  }
>;

// TODO - this name is inconsistent with `AnyNodeDictEntry` in the raw AST, rename it there
export type AnyDictEntryNode = NodeKeyValue | NodeIdentifier;

type NodeUnitValue = ExpressionNode<
  "UnitValue",
  {
    value: NodeFloat;
    unit: string;
  }
>;

type NodeCall = ExpressionNode<
  "Call",
  {
    fn: AnyExpressionNode;
    args: AnyExpressionNode[];
  }
>;

type NodeInfixCall = ExpressionNode<
  "InfixCall",
  {
    op: InfixOperator;
    args: [AnyExpressionNode, AnyExpressionNode];
  }
>;

type NodeUnaryCall = ExpressionNode<
  "UnaryCall",
  {
    op: UnaryOperator;
    arg: AnyExpressionNode;
  }
>;

type NodePipe = ExpressionNode<
  "Pipe",
  {
    leftArg: AnyExpressionNode;
    fn: AnyExpressionNode;
    rightArgs: AnyExpressionNode[];
  }
>;

type NodeDotLookup = ExpressionNode<
  "DotLookup",
  {
    arg: AnyExpressionNode;
    key: string;
  }
>;

type NodeBracketLookup = ExpressionNode<
  "BracketLookup",
  {
    arg: AnyExpressionNode;
    key: AnyExpressionNode;
  }
>;

type NodeFloat = ExpressionNode<
  "Float",
  {
    // floats are always positive, `-123` is an unary operation
    integer: number;
    fractional: string | null; // heading zeros are significant, so we can't store this as a number
    exponent: number | null;
  }
>;

type NodeLambdaParameter = Node<
  "LambdaParameter",
  {
    variable: string;
    annotation: AnyExpressionNode | null;
    unitTypeSignature: NodeUnitTypeSignature | null;
  }
>;

type NodeIdentifier = ExpressionNode<
  "Identifier",
  {
    value: string;
  }
>;

type NodeDecorator = Node<
  "Decorator",
  {
    name: NodeIdentifier;
    args: AnyExpressionNode[];
  }
>;

type LetOrDefun = {
  decorators: NodeDecorator[];
  variable: NodeIdentifier;
  exported: boolean;
};

type NodeLetStatement = Node<
  "LetStatement",
  LetOrDefun & {
    unitTypeSignature: NodeUnitTypeSignature | null;
    value: AnyExpressionNode;
  }
>;

type NodeDefunStatement = Node<
  "DefunStatement",
  LetOrDefun & {
    value: NamedNodeLambda;
  }
>;

type NodeLambda = ExpressionNode<
  "Lambda",
  {
    // Don't try to convert it to string[], ASTNode is intentional because we need locations.
    args: NodeLambdaParameter[];
    body: AnyExpressionNode;
    name: string | null;
    returnUnitType: NodeUnitTypeSignature | null;
  }
>;

export type NamedNodeLambda = NodeLambda & Required<Pick<NodeLambda, "name">>;

type NodeTernary = ExpressionNode<
  "Ternary",
  {
    condition: AnyExpressionNode;
    trueExpression: AnyExpressionNode;
    falseExpression: AnyExpressionNode;
    syntax: "IfThenElse" | "C";
  }
>;

type NodeUnitTypeSignature = Node<
  "UnitTypeSignature",
  {
    body: AnyUnitTypeNode;
  }
>;

type NodeInfixUnitType = Node<
  "InfixUnitType",
  {
    op: TypeOperator;
    args: [AnyUnitTypeNode, AnyUnitTypeNode];
  }
>;

type NodeExponentialUnitType = Node<
  "ExponentialUnitType",
  {
    base: AnyUnitTypeNode;
    exponent: NodeFloat;
  }
>;

type NodeString = ExpressionNode<"String", { value: string }>;

type NodeBoolean = ExpressionNode<"Boolean", { value: boolean }>;

export type TypedASTNode =
  // blocks
  | NodeProgram
  | NodeBlock
  // statements
  | NodeLetStatement
  | NodeDefunStatement
  // functions & lambdas
  | NodeLambda
  // container types
  | NodeArray
  | NodeDict
  | NodeKeyValue
  // various calls
  | NodeUnitValue
  | NodeCall
  | NodeInfixCall
  | NodeUnaryCall
  | NodePipe
  | NodeDecorator
  // [] and .foo
  | NodeDotLookup
  | NodeBracketLookup
  // control flow - if/else
  | NodeTernary
  // type signature
  | NodeUnitTypeSignature
  | NodeInfixUnitType
  | NodeExponentialUnitType
  // identifiers
  | NodeIdentifier
  | NodeLambdaParameter
  // basic values
  | NodeFloat
  | NodeString
  | NodeBoolean;

export type ASTCommentNode = {
  kind: "lineComment" | "blockComment";
  value: string;
  location: LocationRange;
};

export type KindTypedNode<T extends TypedASTNode["kind"]> = Extract<
  TypedASTNode,
  { kind: T }
>;

export const statementKinds = ["LetStatement", "DefunStatement"] as const;

export const expressionKinds: TypedASTNode["kind"][] = [
  "Block",
  "Lambda",
  "Array",
  "Dict",
  "UnitValue",
  "Call",
  "InfixCall",
  "UnaryCall",
  "Pipe",
  "DotLookup",
  "BracketLookup",
  "Ternary",
  "Identifier",
  "Float",
  "String",
  "Boolean",
] as const;
export const unitTypeKinds: TypedASTNode["kind"][] = [
  "Identifier",
  "Float",
  "InfixUnitType",
  "ExponentialUnitType",
] as const;

export type AnyStatementNode = KindTypedNode<(typeof statementKinds)[number]>;
export type AnyExpressionNode = KindTypedNode<(typeof expressionKinds)[number]>;
export type AnyUnitTypeNode = KindTypedNode<(typeof unitTypeKinds)[number]>;

export type TypedAST = KindTypedNode<"Program"> & {
  raw: AST;
  comments: ASTCommentNode[];
  symbolTable: SymbolTable;
};
