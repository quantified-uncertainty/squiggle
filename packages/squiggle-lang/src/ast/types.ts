import { infixFunctions, unaryFunctions } from "./operators.js";

/*
 *`Location` and `LocationRange` types are copy-pasted from Peggy, but
 * converted from interface to type. We need a type because interfaces don't
 * match `JsonValue` type that we use for serialization.
 */

/** Provides information pointing to a location within a source. */
export type Location = {
  /** Line in the parsed source (1-based). */
  line: number;
  /** Column in the parsed source (1-based). */
  column: number;
  /** Offset in the parsed source (0-based). */
  offset: number;
};

/** The `start` and `end` position's of an object within the source. */
export type LocationRange = {
  /** Unlike in Peggy, this must be a string. */
  source: string;
  /** Position at the beginning of the node. */
  start: Location;
  /** Position after the end of the node. */
  end: Location;
};

export type InfixOperator = keyof typeof infixFunctions;

export type UnaryOperator = keyof typeof unaryFunctions;

export type TypeOperator = "*" | "/";

type N<T extends string, V extends object> = {
  kind: T;
  location: LocationRange;
} & V;

/*
 * Specific `Node*` types are mostly not exported, because they're easy to
 * obtain with `KindNode<"Name">` helper.
 */

type NodeProgram = N<
  "Program",
  {
    imports: NodeImport[];
    statements: AnyStatementNode[];
    result: AnyExpressionNode | null;
    // Var name -> statement node, for faster path resolution.
    // Not used for evaluation.
    // Note: symbols point to undecorated statements.
    symbols: { [k in string]: ASTNode };
  }
>;

type NodeBlock = N<
  "Block",
  {
    statements: AnyStatementNode[];
    result: AnyExpressionNode;
  }
>;

type NodeImport = N<
  "Import",
  {
    path: NodeString;
    variable: NodeIdentifier;
  }
>;

type NodeArray = N<
  "Array",
  {
    elements: AnyExpressionNode[];
  }
>;

type NodeDict = N<
  "Dict",
  {
    elements: AnyNodeDictEntry[];
  }
>;
type NodeKeyValue = N<
  "KeyValue",
  {
    key: AnyExpressionNode;
    value: AnyExpressionNode;
  }
>;
export type AnyNodeDictEntry = NodeKeyValue | NodeIdentifier;

type NodeUnitValue = N<
  "UnitValue",
  {
    value: NodeFloat;
    unit: string;
  }
>;

type NodeCall = N<
  "Call",
  {
    fn: AnyExpressionNode;
    args: AnyExpressionNode[];
  }
>;

type NodeInfixCall = N<
  "InfixCall",
  {
    op: InfixOperator;
    args: [AnyExpressionNode, AnyExpressionNode];
  }
>;

type NodeUnaryCall = N<
  "UnaryCall",
  {
    op: UnaryOperator;
    arg: AnyExpressionNode;
  }
>;

type NodePipe = N<
  "Pipe",
  {
    leftArg: AnyExpressionNode;
    fn: AnyExpressionNode;
    rightArgs: AnyExpressionNode[];
  }
>;

type NodeDotLookup = N<
  "DotLookup",
  {
    arg: AnyExpressionNode;
    key: string;
  }
>;

type NodeBracketLookup = N<
  "BracketLookup",
  {
    arg: AnyExpressionNode;
    key: AnyExpressionNode;
  }
>;

type NodeFloat = N<
  "Float",
  {
    // floats are always positive, `-123` is an unary operation
    integer: number;
    fractional: string | null; // heading zeros are significant, so we can't store this as a number
    exponent: number | null;
  }
>;

type NodeLambdaParameter = N<
  "LambdaParameter",
  {
    variable: NodeIdentifier;
    annotation: AnyExpressionNode | null;
    unitTypeSignature: NodeUnitTypeSignature | null;
  }
>;

type NodeIdentifier = N<
  "Identifier",
  {
    value: string;
  }
>;

type NodeDecorator = N<
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

type NodeLetStatement = N<
  "LetStatement",
  LetOrDefun & {
    unitTypeSignature: NodeUnitTypeSignature | null;
    value: AnyExpressionNode;
  }
>;

type NodeDefunStatement = N<
  "DefunStatement",
  LetOrDefun & {
    value: NamedNodeLambda;
  }
>;

type NodeLambda = N<
  "Lambda",
  {
    args: NodeLambdaParameter[];
    body: AnyExpressionNode;
    name: string | null;
    returnUnitType: NodeUnitTypeSignature | null;
  }
>;

export type NamedNodeLambda = NodeLambda & Required<Pick<NodeLambda, "name">>;

type NodeTernary = N<
  "Ternary",
  {
    condition: AnyExpressionNode;
    trueExpression: AnyExpressionNode;
    falseExpression: AnyExpressionNode;
    syntax: "IfThenElse" | "C";
  }
>;

type NodeUnitTypeSignature = N<
  "UnitTypeSignature",
  {
    body: AnyUnitTypeNode;
  }
>;

type NodeInfixUnitType = N<
  "InfixUnitType",
  {
    op: TypeOperator;
    args: [AnyUnitTypeNode, AnyUnitTypeNode];
  }
>;

type NodeExponentialUnitType = N<
  "ExponentialUnitType",
  {
    base: AnyUnitTypeNode;
    exponent: NodeFloat;
  }
>;

type NodeString = N<"String", { value: string }>;

type NodeBoolean = N<"Boolean", { value: boolean }>;

export type ASTNode =
  // blocks
  | NodeProgram
  | NodeImport
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

type Kind = ASTNode["kind"];

export type KindNode<T extends Kind> = Extract<ASTNode, { kind: T }>;

export const statementKinds = [
  "LetStatement",
  "DefunStatement",
] as const satisfies Kind[];

export const expressionKinds = [
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
] as const satisfies Kind[];

export const unitTypeKinds = [
  "Identifier",
  "Float",
  "InfixUnitType",
  "ExponentialUnitType",
] as const satisfies Kind[];

export type AnyStatementNode = KindNode<(typeof statementKinds)[number]>;
export type AnyExpressionNode = KindNode<(typeof expressionKinds)[number]>;
export type AnyUnitTypeNode = KindNode<(typeof unitTypeKinds)[number]>;

export type AST = KindNode<"Program"> & {
  comments: ASTCommentNode[];
};
