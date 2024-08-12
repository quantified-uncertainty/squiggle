import {
  assertExpression,
  assertKind,
  assertStatement,
  assertUnitType,
} from "./asserts.js";
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
  return {
    kind: "Call",
    fn: assertExpression(fn),
    args: args.map((arg) => assertExpression(arg)),
    location,
  };
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
    args: [assertExpression(arg1), assertExpression(arg2)],
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
    args: [assertUnitType(arg1), assertUnitType(arg2)],
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
    base: assertUnitType(base),
    exponent: assertKind(exponent, "Float"),
    location,
  };
}

export function nodeUnaryCall(
  op: UnaryOperator,
  arg: ASTNode,
  location: LocationRange
): KindNode<"UnaryCall"> {
  return { kind: "UnaryCall", op, arg: assertExpression(arg), location };
}

export function nodePipe(
  leftArg: ASTNode,
  fn: ASTNode,
  rightArgs: ASTNode[],
  location: LocationRange
): KindNode<"Pipe"> {
  return {
    kind: "Pipe",
    leftArg: assertExpression(leftArg),
    fn: assertExpression(fn),
    rightArgs: rightArgs.map(assertExpression),
    location,
  };
}

export function nodeDotLookup(
  arg: ASTNode,
  key: string,
  location: LocationRange
): KindNode<"DotLookup"> {
  return {
    kind: "DotLookup",
    arg: assertExpression(arg),
    key,
    location,
  };
}

export function nodeBracketLookup(
  arg: ASTNode,
  key: ASTNode,
  location: LocationRange
): KindNode<"BracketLookup"> {
  return {
    kind: "BracketLookup",
    arg: assertExpression(arg),
    key: assertExpression(key),
    location,
  };
}

export function nodeArray(
  elements: ASTNode[],
  location: LocationRange
): KindNode<"Array"> {
  return { kind: "Array", elements: elements.map(assertExpression), location };
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
  return {
    kind: "UnitValue",
    value: assertKind(value, "Float"),
    unit,
    location,
  };
}

export function nodeBlock(
  statements: ASTNode[],
  result: ASTNode,
  location: LocationRange
): KindNode<"Block"> {
  return {
    kind: "Block",
    statements: statements.map(assertStatement),
    result: assertExpression(result),
    location,
  };
}

export function nodeProgram(
  imports: ASTNode[],
  statements: ASTNode[],
  result: ASTNode | null,
  location: LocationRange
): KindNode<"Program"> {
  const symbols: KindNode<"Program">["symbols"] = {};
  for (const statement of statements) {
    if (
      statement.kind === "LetStatement" ||
      statement.kind === "DefunStatement"
    ) {
      symbols[statement.variable.value] = statement;
    }
  }
  return {
    kind: "Program",
    imports: imports.map((imp) => assertKind(imp, "Import")),
    statements: statements.map(assertStatement),
    result: result ? assertExpression(result) : null,
    symbols,
    location,
  };
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
    body: assertUnitType(body),
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
  variable: ASTNode,
  annotation: ASTNode | null,
  unitTypeSignature: ASTNode | null,
  location: LocationRange
): KindNode<"LambdaParameter"> {
  return {
    kind: "LambdaParameter",
    variable: assertKind(variable, "Identifier"),
    annotation: annotation ? assertExpression(annotation) : null,
    unitTypeSignature: unitTypeSignature
      ? assertKind(unitTypeSignature, "UnitTypeSignature")
      : null,
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
    } satisfies KindNode<"String">;
  }
  return {
    kind: "KeyValue",
    key: assertExpression(key),
    value: assertExpression(value),
    location,
  };
}
export function nodeLambda(
  args: ASTNode[],
  body: ASTNode,
  location: LocationRange,
  name: ASTNode | undefined,
  returnUnitType: ASTNode | null
): KindNode<"Lambda"> {
  return {
    kind: "Lambda",
    args: args.map((arg) => assertKind(arg, "LambdaParameter")),
    body: assertExpression(body),
    name: name === undefined ? null : assertKind(name, "Identifier").value,
    returnUnitType: returnUnitType
      ? assertKind(returnUnitType, "UnitTypeSignature")
      : null,
    location,
  };
}
export function nodeLetStatement(
  decorators: ASTNode[],
  _variable: ASTNode,
  unitTypeSignature: ASTNode | null,
  _value: ASTNode,
  exported: boolean,
  location: LocationRange
): KindNode<"LetStatement"> {
  const variable = assertKind(_variable, "Identifier");
  const value =
    _value.kind === "Lambda"
      ? { ..._value, name: variable.value }
      : assertExpression(_value);

  return {
    kind: "LetStatement",
    decorators: decorators.map((decorator) =>
      assertKind(decorator, "Decorator")
    ),
    variable,
    unitTypeSignature: unitTypeSignature
      ? assertKind(unitTypeSignature, "UnitTypeSignature")
      : null,
    value,
    exported,
    location,
  };
}
export function nodeDefunStatement(
  decorators: ASTNode[],
  variable: ASTNode,
  value: NamedNodeLambda,
  exported: boolean,
  location: LocationRange
): KindNode<"DefunStatement"> {
  return {
    kind: "DefunStatement",
    decorators: decorators.map((decorator) =>
      assertKind(decorator, "Decorator")
    ),
    variable: assertKind(variable, "Identifier"),
    value,
    exported,
    location,
  };
}

export function nodeDecorator(
  name: ASTNode,
  args: ASTNode[],
  location: LocationRange
): KindNode<"Decorator"> {
  return {
    kind: "Decorator",
    name: assertKind(name, "Identifier"),
    args: args.map(assertExpression),
    location,
  };
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
    condition: assertExpression(condition),
    trueExpression: assertExpression(trueExpression),
    falseExpression: assertExpression(falseExpression),
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
