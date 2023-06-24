import { LocationRange } from "peggy";

export const infixFunctions = {
  "+": "add",
  "-": "subtract",
  "!=": "unequal",
  ".-": "dotSubtract",
  ".*": "dotMultiply",
  "./": "dotDivide",
  ".^": "dotPow",
  ".+": "dotAdd",
  "*": "multiply",
  "/": "divide",
  "&&": "and",
  "^": "pow", // or xor
  "<": "smaller",
  "<=": "smallerEq",
  "==": "equal",
  ">": "larger",
  ">=": "largerEq",
  "||": "or",
  to: "credibleIntervalToDistribution",
};
export type InfixOperator = keyof typeof infixFunctions;

export const unaryFunctions = {
  "-": "unaryMinus",
  "!": "not",
  ".-": "unaryDotMinus",
};
export type UnaryOperator = keyof typeof unaryFunctions;

type Node = {
  location: LocationRange;
};

type N<T extends string, V extends {}> = Node & { type: T } & V;

type NodeBlock = N<
  "Block",
  {
    statements: ASTNode[]; // should be NodeStatement[] ?
  }
>;

type NodeProgram = N<
  "Program",
  {
    imports: [NodeString, NodeIdentifier][];
    statements: ASTNode[]; // should be NodeStatement[] ?
  }
>;

type NodeArray = N<"Array", { elements: ASTNode[] }>;

type NodeRecord = N<"Record", { elements: NodeKeyValue[] }>;

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

type NodeFloat = N<"Float", { value: number }>;

type NodeInteger = N<"Integer", { value: number }>;

type NodeIdentifier = N<"Identifier", { value: string }>;

type NodeLetStatement = N<
  "LetStatement",
  { variable: NodeIdentifier; value: ASTNode }
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

type NamedNodeLambda = NodeLambda & Required<Pick<NodeLambda, "name">>;

type NodeDefunStatement = N<
  "DefunStatement",
  {
    variable: NodeIdentifier;
    value: NamedNodeLambda;
  }
>;

type NodeTernary = N<
  "Ternary",
  {
    condition: ASTNode;
    trueExpression: ASTNode;
    falseExpression: ASTNode;
    kind: "IfThenElse" | "C";
  }
>;

type NodeKeyValue = N<
  "KeyValue",
  {
    key: ASTNode;
    value: ASTNode;
  }
>;

type NodeString = N<"String", { value: string }>;

type NodeBoolean = N<"Boolean", { value: boolean }>;

type NodeVoid = N<"Void", {}>;

export type ASTNode =
  | NodeArray
  | NodeRecord
  | NodeBlock
  | NodeProgram
  | NodeCall
  | NodeInfixCall
  | NodeUnaryCall
  | NodePipe
  | NodeDotLookup
  | NodeBracketLookup
  | NodeFloat
  | NodeInteger
  | NodeIdentifier
  | NodeLetStatement
  | NodeDefunStatement
  | NodeLambda
  | NodeTernary
  | NodeKeyValue
  | NodeString
  | NodeBoolean
  | NodeVoid;

export function nodeCall(
  fn: ASTNode,
  args: ASTNode[],
  location: LocationRange
): NodeCall {
  return { type: "Call", fn, args, location };
}

export function makeInfixChain(
  head: ASTNode,
  tail: [InfixOperator, ASTNode][],
  location: LocationRange
): ASTNode {
  return tail.reduce((result, [operator, right]) => {
    return nodeInfixCall(operator, result, right, location);
  }, head);
}

export function nodeInfixCall(
  op: InfixOperator,
  arg1: ASTNode,
  arg2: ASTNode,
  location: LocationRange
): NodeInfixCall {
  return {
    type: "InfixCall",
    op,
    args: [arg1, arg2],
    location,
  };
}

export function nodeUnaryCall(
  op: UnaryOperator,
  arg: ASTNode,
  location: LocationRange
): NodeUnaryCall {
  return { type: "UnaryCall", op, arg, location };
}

export function nodePipe(
  leftArg: ASTNode,
  fn: ASTNode,
  rightArgs: ASTNode[],
  location: LocationRange
): NodePipe {
  return { type: "Pipe", leftArg, fn, rightArgs, location };
}

export function nodeDotLookup(
  arg: ASTNode,
  key: string,
  location: LocationRange
): NodeDotLookup {
  return { type: "DotLookup", arg, key, location };
}

export function nodeBracketLookup(
  arg: ASTNode,
  key: ASTNode,
  location: LocationRange
): NodeBracketLookup {
  return { type: "BracketLookup", arg, key, location };
}

export function constructArray(
  elements: ASTNode[],
  location: LocationRange
): NodeArray {
  return { type: "Array", elements, location };
}
export function constructRecord(
  elements: NodeKeyValue[],
  location: LocationRange
): NodeRecord {
  return { type: "Record", elements, location };
}

export function nodeBlock(
  statements: ASTNode[],
  location: LocationRange
): NodeBlock {
  return { type: "Block", statements, location };
}
export function nodeProgram(
  imports: [NodeString, NodeIdentifier][],
  statements: ASTNode[],
  location: LocationRange
): NodeProgram {
  return { type: "Program", imports, statements, location };
}
export function nodeBoolean(
  value: boolean,
  location: LocationRange
): NodeBoolean {
  return { type: "Boolean", value, location };
}
export function nodeFloat(value: number, location: LocationRange): NodeFloat {
  return { type: "Float", value, location };
}
export function nodeIdentifier(
  value: string,
  location: LocationRange
): NodeIdentifier {
  return { type: "Identifier", value, location };
}
export function nodeInteger(
  value: number,
  location: LocationRange
): NodeInteger {
  return { type: "Integer", value, location };
}
export function nodeKeyValue(
  key: ASTNode,
  value: ASTNode,
  location: LocationRange
): NodeKeyValue {
  if (key.type === "Identifier") {
    key = {
      ...key,
      type: "String",
    };
  }
  return { type: "KeyValue", key, value, location };
}
export function nodeLambda(
  args: ASTNode[],
  body: ASTNode,
  location: LocationRange,
  name?: NodeIdentifier
): NodeLambda {
  return { type: "Lambda", args, body, location, name: name?.value };
}
export function nodeLetStatement(
  variable: NodeIdentifier,
  value: ASTNode,
  location: LocationRange
): NodeLetStatement {
  const patchedValue =
    value.type === "Lambda" ? { ...value, name: variable.value } : value;
  return { type: "LetStatement", variable, value: patchedValue, location };
}
export function nodeDefunStatement(
  variable: NodeIdentifier,
  value: NamedNodeLambda,
  location: LocationRange
): NodeDefunStatement {
  return { type: "DefunStatement", variable, value, location };
}
export function nodeString(value: string, location: LocationRange): NodeString {
  return { type: "String", value, location };
}
export function nodeTernary(
  condition: ASTNode,
  trueExpression: ASTNode,
  falseExpression: ASTNode,
  kind: NodeTernary["kind"],
  location: LocationRange
): NodeTernary {
  return {
    type: "Ternary",
    condition,
    trueExpression,
    falseExpression,
    kind,
    location,
  };
}

export function nodeVoid(location: LocationRange): NodeVoid {
  return { type: "Void", location };
}

export type ASTCommentNode = {
  type: "lineComment" | "blockComment";
  value: string;
  location: LocationRange;
};

export function lineComment(
  text: string,
  location: LocationRange
): ASTCommentNode {
  return {
    type: "lineComment",
    value: text,
    location,
  };
}

export function blockComment(
  text: string,
  location: LocationRange
): ASTCommentNode {
  return {
    type: "blockComment",
    value: text,
    location,
  };
}
