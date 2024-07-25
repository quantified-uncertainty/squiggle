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

type NodeBlock = N<
  "Block",
  {
    statements: ASTNode[];
    result: ASTNode;
  }
>;

type NodeProgram = N<
  "Program",
  {
    imports: [NodeString, NodeIdentifier][];
    statements: ASTNode[];
    result: ASTNode | null;
  }
>;

type NodeArray = N<
  "Array",
  {
    elements: ASTNode[];
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
    key: ASTNode;
    value: ASTNode;
  }
>;
export type AnyNodeDictEntry = NodeKeyValue | NodeIdentifier;

type NodeUnitValue = N<
  "UnitValue",
  {
    value: ASTNode;
    unit: string;
  }
>;

type NodeCall = N<
  "Call",
  {
    fn: ASTNode;
    args: ASTNode[];
  }
>;

type NodeInfixCall = N<
  "InfixCall",
  {
    op: InfixOperator;
    args: [ASTNode, ASTNode];
  }
>;

type NodeUnaryCall = N<
  "UnaryCall",
  {
    op: UnaryOperator;
    arg: ASTNode;
  }
>;

type NodePipe = N<
  "Pipe",
  {
    leftArg: ASTNode;
    fn: ASTNode;
    rightArgs: ASTNode[];
  }
>;

type NodeDotLookup = N<
  "DotLookup",
  {
    arg: ASTNode;
    key: string;
  }
>;

type NodeBracketLookup = N<
  "BracketLookup",
  {
    arg: ASTNode;
    key: ASTNode;
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
    variable: string;
    annotation: ASTNode | null;
    unitTypeSignature: NodeTypeSignature | null;
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
    args: ASTNode[];
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
    unitTypeSignature: NodeTypeSignature | null;
    value: ASTNode;
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
    // Don't try to convert it to string[], ASTNode is intentional because we need locations.
    args: ASTNode[];
    body: ASTNode;
    name: string | null;
    returnUnitType: NodeTypeSignature | null;
  }
>;

export type NamedNodeLambda = NodeLambda & Required<Pick<NodeLambda, "name">>;

type NodeTernary = N<
  "Ternary",
  {
    condition: ASTNode;
    trueExpression: ASTNode;
    falseExpression: ASTNode;
    syntax: "IfThenElse" | "C";
  }
>;

type NodeTypeSignature = N<
  "UnitTypeSignature",
  {
    body: ASTNode;
  }
>;

type NodeInfixUnitType = N<
  "InfixUnitType",
  {
    op: TypeOperator;
    args: [ASTNode, ASTNode];
  }
>;

type NodeExponentialUnitType = N<
  "ExponentialUnitType",
  {
    base: ASTNode;
    exponent: ASTNode;
  }
>;

type NodeString = N<"String", { value: string }>;

type NodeBoolean = N<"Boolean", { value: boolean }>;

export type ASTNode =
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
  | NodeTypeSignature
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

export type KindNode<T extends ASTNode["kind"]> = Extract<ASTNode, { kind: T }>;

export type AST = KindNode<"Program"> & {
  comments: ASTCommentNode[];
};
