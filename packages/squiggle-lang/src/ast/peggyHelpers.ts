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
  to: "to",
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
type AnyNodeDictEntry = NodeKeyValue | NodeIdentifier;

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

type NodeLetStatement = N<
  "LetStatement",
  {
    variable: NodeIdentifier;
    value: ASTNode;
    exported: boolean;
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

type NamedNodeLambda = NodeLambda & Required<Pick<NodeLambda, "name">>;

type NodeDefunStatement = N<
  "DefunStatement",
  {
    variable: NodeIdentifier;
    value: NamedNodeLambda;
    exported: boolean;
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

type NodeString = N<"String", { value: string }>;

type NodeBoolean = N<"Boolean", { value: boolean }>;

type NodeVoid = N<"Void", object>;

export type ASTNode =
  | NodeArray
  | NodeDict
  | NodeBlock
  | NodeProgram
  | NodeUnitValue
  | NodeCall
  | NodeInfixCall
  | NodeUnaryCall
  | NodePipe
  | NodeDotLookup
  | NodeBracketLookup
  | NodeFloat
  | NodeIdentifier
  | NodeIdentifierWithAnnotation
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

export function nodeArray(
  elements: ASTNode[],
  location: LocationRange
): NodeArray {
  return { type: "Array", elements, location };
}
export function nodeDict(
  elements: AnyNodeDictEntry[],
  location: LocationRange
): NodeDict {
  const symbols: NodeDict["symbols"] = {};
  for (const element of elements) {
    if (element.type === "KeyValue" && element.key.type === "String") {
      symbols[element.key.value] = element;
    } else if (element.type === "Identifier") {
      symbols[element.value] = element;
    }
  }
  return { type: "Dict", elements, symbols, location };
}

export function nodeUnitValue(
  value: ASTNode,
  unit: string,
  location: LocationRange
): NodeUnitValue {
  return { type: "UnitValue", value, unit, location };
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
  const symbols: NodeProgram["symbols"] = {};
  for (const statement of statements) {
    if (
      statement.type === "LetStatement" ||
      statement.type === "DefunStatement"
    ) {
      symbols[statement.variable.value] = statement;
    }
  }
  return { type: "Program", imports, statements, symbols, location };
}
export function nodeBoolean(
  value: boolean,
  location: LocationRange
): NodeBoolean {
  return { type: "Boolean", value, location };
}

export function nodeFloat(
  args: Omit<NodeFloat, "type" | "location">,
  location: LocationRange
): NodeFloat {
  return { type: "Float", ...args, location };
}

export function nodeIdentifier(
  value: string,
  location: LocationRange
): NodeIdentifier {
  return { type: "Identifier", value, location };
}

export function nodeIdentifierWithAnnotation(
  variable: string,
  annotation: ASTNode,
  location: LocationRange
): NodeIdentifierWithAnnotation {
  return { type: "IdentifierWithAnnotation", variable, annotation, location };
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
  exported: boolean,
  location: LocationRange
): NodeLetStatement {
  const patchedValue =
    value.type === "Lambda" ? { ...value, name: variable.value } : value;
  return {
    type: "LetStatement",
    variable,
    value: patchedValue,
    exported,
    location,
  };
}
export function nodeDefunStatement(
  variable: NodeIdentifier,
  value: NamedNodeLambda,
  exported: boolean,
  location: LocationRange
): NodeDefunStatement {
  return { type: "DefunStatement", variable, value, exported, location };
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

export function parseEscapeSequence(
  char: string[],
  location: LocationRange,
  error: (e: any, l: LocationRange) => void
) {
  if (char[0] == "'") {
    return "'";
  } else {
    try {
      return JSON.parse(`"\\${char.join("")}"`);
    } catch (e) {
      error(`Incorrect escape sequence: ${char.join("")}`, location);
    }
  }
}
