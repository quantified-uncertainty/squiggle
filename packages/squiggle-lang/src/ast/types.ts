import { infixFunctions, unaryFunctions } from "./operators.js";

// Types copy-pasted from Peggy, but converted from interface to type.
// We need a type because interfaces don't match JsonValue type that we use for serialization.

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
  /** Position at the beginning of the expression. */
  start: Location;
  /** Position after the end of the expression. */
  end: Location;
};

export type AST = Extract<ASTNode, { type: "Program" }> & {
  comments: ASTCommentNode[];
};

export type InfixOperator = keyof typeof infixFunctions;

export type UnaryOperator = keyof typeof unaryFunctions;

type Node = {
  location: LocationRange;
};

type N<T extends string, V extends object> = Node & { type: T } & V;

type NodeBlock = N<
  "Block",
  {
    statements: ASTNode[];
  }
>;

type NodeProgram = N<
  "Program",
  {
    imports: [NodeString, NodeIdentifier][];
    statements: ASTNode[];
    // Var name -> statement node, for faster path resolution.
    // Not used for evaluation.
    // Note: symbols point to undecorated statements.
    symbols: { [k in string]: ASTNode };
  }
>;

type NodeArray = N<"Array", { elements: ASTNode[] }>;

type NodeDict = N<
  "Dict",
  {
    elements: AnyNodeDictEntry[];
    // Static key -> node, for faster path resolution.
    // Not used for evaluation.
    symbols: { [k in number | string]: AnyNodeDictEntry };
  }
>;
type NodeKeyValue = N<
  "KeyValue",
  {
    key: ASTNode;
    value: ASTNode;
  }
>;
export type AnyNodeDictEntry = NodeKeyValue | NodeIdentifier;

type NodeUnitValue = N<"UnitValue", { value: ASTNode; unit: string }>;

type NodeCall = N<"Call", { fn: ASTNode; args: ASTNode[] }>;

type NodeInfixCall = N<
  "InfixCall",
  { op: InfixOperator; args: [ASTNode, ASTNode] }
>;

type NodeUnaryCall = N<"UnaryCall", { op: UnaryOperator; arg: ASTNode }>;

type NodePipe = N<
  "Pipe",
  {
    leftArg: ASTNode;
    fn: ASTNode;
    rightArgs: ASTNode[];
  }
>;

type NodeDotLookup = N<"DotLookup", { arg: ASTNode; key: string }>;

type NodeBracketLookup = N<"BracketLookup", { arg: ASTNode; key: ASTNode }>;

type NodeFloat = N<
  "Float",
  {
    // floats are always positive, `-123` is an unary operation
    integer: number;
    fractional: string | null; // heading zeros are significant, so we can't store this as a number
    exponent: number | null;
  }
>;

type NodeIdentifierWithAnnotation = N<
  "IdentifierWithAnnotation",
  { variable: string; annotation: ASTNode }
>;

type NodeIdentifier = N<"Identifier", { value: string }>;

type NodeDecorator = N<"Decorator", { name: NodeIdentifier; args: ASTNode[] }>;

type LetOrDefun = {
  variable: NodeIdentifier;
  exported: boolean;
};

type NodeLetStatement = N<"LetStatement", LetOrDefun & { value: ASTNode }>;

type NodeDefunStatement = N<
  "DefunStatement",
  LetOrDefun & { value: NamedNodeLambda }
>;

type NodeDecoratedStatement = N<
  "DecoratedStatement",
  {
    decorator: NodeDecorator;
    statement: NodeLetStatement | NodeDefunStatement | NodeDecoratedStatement;
  }
>;

type NodeLambda = N<
  "Lambda",
  {
    // Don't try to convert it to string[], ASTNode is intentional because we need locations.
    args: ASTNode[];
    body: ASTNode;
    name?: string;
  }
>;

export type NamedNodeLambda = NodeLambda & Required<Pick<NodeLambda, "name">>;

type NodeTernary = N<
  "Ternary",
  {
    condition: ASTNode;
    trueExpression: ASTNode;
    falseExpression: ASTNode;
    kind: "IfThenElse" | "C";
  }
>;

type NodeString = N<"String", { value: string }>;

type NodeBoolean = N<"Boolean", { value: boolean }>;

export type ASTNode =
  // blocks
  | NodeProgram
  | NodeBlock
  // statements
  | NodeDecoratedStatement
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
  // identifiers
  | NodeIdentifier
  | NodeIdentifierWithAnnotation
  // basic values
  | NodeFloat
  | NodeString
  | NodeBoolean;

export type ASTCommentNode = {
  type: "lineComment" | "blockComment";
  value: string;
  location: LocationRange;
};
