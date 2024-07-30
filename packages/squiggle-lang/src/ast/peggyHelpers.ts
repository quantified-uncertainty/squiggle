import {
  AnyNodeDictEntry,
  ASTCommentNode,
  ASTNode,
  InfixOperator,
  KindNode,
  LocationRange,
  NamedNodeLambda,
  TypeOperator,
  UnaryOperator,
} from "./types.js";

export function nodeCall(
  fn: ASTNode,
  args: ASTNode[],
  location: LocationRange
): KindNode<"Call"> {
  return { kind: "Call", fn, args, location };
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
): KindNode<"InfixCall"> {
  return {
    kind: "InfixCall",
    op,
    args: [arg1, arg2],
    location,
  };
}

export function makeInfixTypeChain(
  head: ASTNode,
  tail: [TypeOperator, ASTNode][],
  location: LocationRange
): ASTNode {
  return tail.reduce((result, [operator, right]) => {
    return nodeInfixUnitType(operator, result, right, location);
  }, head);
}

export function nodeInfixUnitType(
  op: TypeOperator,
  arg1: ASTNode,
  arg2: ASTNode,
  location: LocationRange
): KindNode<"InfixUnitType"> {
  return {
    kind: "InfixUnitType",
    op,
    args: [arg1, arg2],
    location,
  };
}

export function nodeExponentialUnitType(
  base: ASTNode,
  exponent: ASTNode,
  location: LocationRange
): KindNode<"ExponentialUnitType"> {
  return {
    kind: "ExponentialUnitType",
    base: base,
    exponent: exponent,
    location: location,
  };
}

export function nodeUnaryCall(
  op: UnaryOperator,
  arg: ASTNode,
  location: LocationRange
): KindNode<"UnaryCall"> {
  return { kind: "UnaryCall", op, arg, location };
}

export function nodePipe(
  leftArg: ASTNode,
  fn: ASTNode,
  rightArgs: ASTNode[],
  location: LocationRange
): KindNode<"Pipe"> {
  return { kind: "Pipe", leftArg, fn, rightArgs, location };
}

export function nodeDotLookup(
  arg: ASTNode,
  key: string,
  location: LocationRange
): KindNode<"DotLookup"> {
  return { kind: "DotLookup", arg, key, location };
}

export function nodeBracketLookup(
  arg: ASTNode,
  key: ASTNode,
  location: LocationRange
): KindNode<"BracketLookup"> {
  return { kind: "BracketLookup", arg, key, location };
}

export function nodeArray(
  elements: ASTNode[],
  location: LocationRange
): KindNode<"Array"> {
  return { kind: "Array", elements, location };
}
export function nodeDict(
  elements: AnyNodeDictEntry[],
  location: LocationRange
): KindNode<"Dict"> {
  return { kind: "Dict", elements, location };
}

export function nodeUnitValue(
  value: ASTNode,
  unit: string,
  location: LocationRange
): KindNode<"UnitValue"> {
  return { kind: "UnitValue", value, unit, location };
}

export function nodeBlock(
  statements: ASTNode[],
  result: ASTNode,
  location: LocationRange
): KindNode<"Block"> {
  return { kind: "Block", statements, result, location };
}

export function nodeProgram(
  imports: KindNode<"Import">[],
  statements: ASTNode[],
  result: ASTNode | null,
  location: LocationRange
): KindNode<"Program"> {
  return { kind: "Program", imports, statements, result, location };
}

export function nodeImport(
  path: KindNode<"String">,
  variable: KindNode<"Identifier">,
  location: LocationRange
): KindNode<"Import"> {
  return { kind: "Import", path, variable, location };
}

export function nodeTypeSignature(
  body: ASTNode,
  location: LocationRange
): KindNode<"UnitTypeSignature"> {
  return {
    kind: "UnitTypeSignature",
    body: body,
    location: location,
  };
}

export function nodeBoolean(
  value: boolean,
  location: LocationRange
): KindNode<"Boolean"> {
  return { kind: "Boolean", value, location };
}

export function nodeFloat(
  args: Omit<KindNode<"Float">, "kind" | "location">,
  location: LocationRange
): KindNode<"Float"> {
  return { kind: "Float", ...args, location };
}

export function nodeIdentifier(
  value: string,
  location: LocationRange
): KindNode<"Identifier"> {
  return { kind: "Identifier", value, location };
}

export function nodeLambdaParameter(
  variable: KindNode<"Identifier">,
  annotation: ASTNode | null,
  unitTypeSignature: KindNode<"UnitTypeSignature"> | null,
  location: LocationRange
): KindNode<"LambdaParameter"> {
  return {
    kind: "LambdaParameter",
    variable,
    annotation,
    unitTypeSignature,
    location,
  };
}

export function nodeKeyValue(
  key: ASTNode,
  value: ASTNode,
  location: LocationRange
): KindNode<"KeyValue"> {
  if (key.kind === "Identifier") {
    key = {
      ...key,
      kind: "String",
    };
  }
  return { kind: "KeyValue", key, value, location };
}
export function nodeLambda(
  args: ASTNode[],
  body: ASTNode,
  location: LocationRange,
  name: KindNode<"Identifier"> | undefined,
  returnUnitType: KindNode<"UnitTypeSignature"> | null
): KindNode<"Lambda"> {
  return {
    kind: "Lambda",
    args,
    body,
    name: name?.value ?? null,
    returnUnitType,
    location,
  };
}
export function nodeLetStatement(
  decorators: KindNode<"Decorator">[],
  variable: KindNode<"Identifier">,
  unitTypeSignature: KindNode<"UnitTypeSignature"> | null,
  value: ASTNode,
  exported: boolean,
  location: LocationRange
): KindNode<"LetStatement"> {
  const patchedValue =
    value.kind === "Lambda" ? { ...value, name: variable.value } : value;
  return {
    kind: "LetStatement",
    decorators,
    variable,
    unitTypeSignature,
    value: patchedValue,
    exported,
    location,
  };
}
export function nodeDefunStatement(
  decorators: KindNode<"Decorator">[],
  variable: KindNode<"Identifier">,
  value: NamedNodeLambda,
  exported: boolean,
  location: LocationRange
): KindNode<"DefunStatement"> {
  return {
    kind: "DefunStatement",
    decorators,
    variable,
    value,
    exported,
    location,
  };
}

export function nodeDecorator(
  name: KindNode<"Identifier">,
  args: ASTNode[],
  location: LocationRange
): KindNode<"Decorator"> {
  return { kind: "Decorator", name, args, location };
}

export function nodeString(
  value: string,
  location: LocationRange
): KindNode<"String"> {
  return { kind: "String", value, location };
}

export function nodeTernary(
  condition: ASTNode,
  trueExpression: ASTNode,
  falseExpression: ASTNode,
  syntax: KindNode<"Ternary">["syntax"],
  location: LocationRange
): KindNode<"Ternary"> {
  return {
    kind: "Ternary",
    condition,
    trueExpression,
    falseExpression,
    syntax,
    location,
  };
}

export function lineComment(
  text: string,
  location: LocationRange
): ASTCommentNode {
  return {
    kind: "lineComment",
    value: text,
    location,
  };
}

export function blockComment(
  text: string,
  location: LocationRange
): ASTCommentNode {
  return {
    kind: "blockComment",
    value: text,
    location,
  };
}

export function parseEscapeSequence(
  char: string[],
  location: LocationRange,
  error: (e: any, l: LocationRange) => void
) {
  if (char[0] === "'") {
    return "'";
  } else {
    try {
      return JSON.parse(`"\\${char.join("")}"`);
    } catch (e) {
      error(`Incorrect escape sequence: ${char.join("")}`, location);
    }
  }
}
