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
    statements: AnyPeggyNode[]; // should be NodeStatement[] ?
  }
>;

type NodeProgram = N<
  "Program",
  {
    statements: AnyPeggyNode[]; // should be NodeStatement[] ?
  }
>;

type NodeArray = N<"Array", { elements: AnyPeggyNode[] }>;

type NodeRecord = N<"Record", { elements: NodeKeyValue[] }>;

type NodeCall = N<"Call", { fn: AnyPeggyNode; args: AnyPeggyNode[] }>;

type NodeInfixCall = N<
  "InfixCall",
  { op: InfixOperator; args: [AnyPeggyNode, AnyPeggyNode] }
>;

type NodeUnaryCall = N<"UnaryCall", { op: UnaryOperator; arg: AnyPeggyNode }>;

type NodeDotLookup = N<"DotLookup", { arg: AnyPeggyNode; key: string }>;

type NodeBracketLookup = N<
  "BracketLookup",
  { arg: AnyPeggyNode; key: AnyPeggyNode }
>;

type NodeFloat = N<"Float", { value: number }>;

type NodeInteger = N<"Integer", { value: number }>;

type NodeIdentifier = N<"Identifier", { value: string }>;

type NodeModuleIdentifier = N<"ModuleIdentifier", { value: string }>;

type NodeLetStatement = N<
  "LetStatement",
  { variable: NodeIdentifier; value: AnyPeggyNode }
>;

type NodeLambda = N<
  "Lambda",
  {
    args: AnyPeggyNode[];
    body: AnyPeggyNode; // should be a NodeBlock
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
    condition: AnyPeggyNode;
    trueExpression: AnyPeggyNode;
    falseExpression: AnyPeggyNode;
    kind: "IfThenElse" | "C";
  }
>;

type NodeKeyValue = N<
  "KeyValue",
  {
    key: AnyPeggyNode;
    value: AnyPeggyNode;
  }
>;

type NodeString = N<"String", { value: string }>;

type NodeBoolean = N<"Boolean", { value: boolean }>;

type NodeVoid = N<"Void", {}>;

export type AnyPeggyNode =
  | NodeArray
  | NodeRecord
  | NodeBlock
  | NodeProgram
  | NodeCall
  | NodeInfixCall
  | NodeUnaryCall
  | NodeDotLookup
  | NodeBracketLookup
  | NodeFloat
  | NodeInteger
  | NodeIdentifier
  | NodeModuleIdentifier
  | NodeLetStatement
  | NodeDefunStatement
  | NodeLambda
  | NodeTernary
  | NodeKeyValue
  | NodeString
  | NodeBoolean
  | NodeVoid;

export function nodeInfixCall(
  op: InfixOperator,
  arg1: AnyPeggyNode,
  arg2: AnyPeggyNode,
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
  arg: AnyPeggyNode,
  location: LocationRange
): NodeUnaryCall {
  return { type: "UnaryCall", op, arg, location };
}

export function nodeDotLookup(
  arg: AnyPeggyNode,
  key: string,
  location: LocationRange
): NodeDotLookup {
  return { type: "DotLookup", arg, key, location };
}

export function nodeBracketLookup(
  arg: AnyPeggyNode,
  key: AnyPeggyNode,
  location: LocationRange
): NodeBracketLookup {
  return { type: "BracketLookup", arg, key, location };
}

export function constructArray(
  elements: AnyPeggyNode[],
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
  statements: AnyPeggyNode[],
  location: LocationRange
): NodeBlock {
  return { type: "Block", statements, location };
}
export function nodeProgram(
  statements: AnyPeggyNode[],
  location: LocationRange
): NodeProgram {
  return { type: "Program", statements, location };
}
export function nodeBoolean(
  value: boolean,
  location: LocationRange
): NodeBoolean {
  return { type: "Boolean", value, location };
}
export function nodeCall(
  fn: AnyPeggyNode,
  args: AnyPeggyNode[],
  location: LocationRange
): NodeCall {
  return { type: "Call", fn, args, location };
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
  key: AnyPeggyNode,
  value: AnyPeggyNode,
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
  args: AnyPeggyNode[],
  body: AnyPeggyNode,
  location: LocationRange,
  name?: NodeIdentifier
): NodeLambda {
  return { type: "Lambda", args, body, location, name: name?.value };
}
export function nodeLetStatement(
  variable: NodeIdentifier,
  value: AnyPeggyNode,
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
export function nodeModuleIdentifier(
  value: string,
  location: LocationRange
): NodeModuleIdentifier {
  return { type: "ModuleIdentifier", value, location };
}
export function nodeString(value: string, location: LocationRange): NodeString {
  return { type: "String", value, location };
}
export function nodeTernary(
  condition: AnyPeggyNode,
  trueExpression: AnyPeggyNode,
  falseExpression: AnyPeggyNode,
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
