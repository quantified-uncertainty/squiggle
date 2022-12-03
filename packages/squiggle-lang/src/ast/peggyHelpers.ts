import { LocationRange } from "peggy";

export const toFunction = {
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

export const unaryToFunction = {
  "-": "unaryMinus",
  "!": "not",
  ".-": "unaryDotMinus",
};

export const postOperatorToFunction = {
  ".": "$_atIndex_$",
  "()": "$$_applyAll_$$",
  "[]": "$_atIndex_$",
};

type Node = {
  location: LocationRange;
};

type N<T extends string, V extends {}> = Node & { type: T } & V;

type NodeBlock = N<"Block", { statements: AnyPeggyNode[] }>;

type NodeProgram = N<"Program", { statements: AnyPeggyNode[] }>;

type NodeArray = N<"Array", { elements: AnyPeggyNode[] }>;

type NodeRecord = N<"Record", { elements: NodeKeyValue[] }>;

type NodeCall = N<"Call", { fn: AnyPeggyNode; args: AnyPeggyNode[] }>;

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
  { args: AnyPeggyNode[]; body: AnyPeggyNode; name?: string }
>;

type NodeTernary = N<
  "Ternary",
  {
    condition: AnyPeggyNode;
    trueExpression: AnyPeggyNode;
    falseExpression: AnyPeggyNode;
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
  | NodeFloat
  | NodeInteger
  | NodeIdentifier
  | NodeModuleIdentifier
  | NodeLetStatement
  | NodeLambda
  | NodeTernary
  | NodeKeyValue
  | NodeString
  | NodeBoolean
  | NodeVoid;

export function makeFunctionCall(
  fn: string,
  args: AnyPeggyNode[],
  location: LocationRange
) {
  if (fn === "$$_applyAll_$$") {
    return nodeCall(args[0], args.splice(1), location);
  } else {
    return nodeCall(nodeIdentifier(fn, location), args, location);
  }
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
  location: LocationRange
): NodeTernary {
  return {
    type: "Ternary",
    condition,
    trueExpression,
    falseExpression,
    location,
  };
}

export function nodeVoid(location: LocationRange): NodeVoid {
  return { type: "Void", location };
}
