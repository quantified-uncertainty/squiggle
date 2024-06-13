import {
  AnyNodeDictEntry,
  ASTCommentNode,
  ASTNode,
  InfixOperator,
  LocationRange,
  NamedNodeLambda,
  UnaryOperator,
} from "./types.js";

type TypedNode<T extends ASTNode["type"]> = Extract<ASTNode, { type: T }>;

export function nodeCall(
  fn: ASTNode,
  args: ASTNode[],
  location: LocationRange
): TypedNode<"Call"> {
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
): TypedNode<"InfixCall"> {
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
): TypedNode<"UnaryCall"> {
  return { type: "UnaryCall", op, arg, location };
}

export function nodePipe(
  leftArg: ASTNode,
  fn: ASTNode,
  rightArgs: ASTNode[],
  location: LocationRange
): TypedNode<"Pipe"> {
  return { type: "Pipe", leftArg, fn, rightArgs, location };
}

export function nodeDotLookup(
  arg: ASTNode,
  key: string,
  location: LocationRange
): TypedNode<"DotLookup"> {
  return { type: "DotLookup", arg, key, location };
}

export function nodeBracketLookup(
  arg: ASTNode,
  key: ASTNode,
  location: LocationRange
): TypedNode<"BracketLookup"> {
  return { type: "BracketLookup", arg, key, location };
}

export function nodeArray(
  elements: ASTNode[],
  location: LocationRange
): TypedNode<"Array"> {
  return { type: "Array", elements, location };
}
export function nodeDict(
  elements: AnyNodeDictEntry[],
  location: LocationRange
): TypedNode<"Dict"> {
  const symbols: TypedNode<"Dict">["symbols"] = {};
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
): TypedNode<"UnitValue"> {
  return { type: "UnitValue", value, unit, location };
}

export function nodeBlock(
  statements: ASTNode[],
  location: LocationRange
): TypedNode<"Block"> {
  return { type: "Block", statements, location };
}
export function nodeProgram(
  imports: [TypedNode<"String">, TypedNode<"Identifier">][],
  statements: ASTNode[],
  location: LocationRange
): TypedNode<"Program"> {
  const symbols: TypedNode<"Program">["symbols"] = {};
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
): TypedNode<"Boolean"> {
  return { type: "Boolean", value, location };
}

export function nodeFloat(
  args: Omit<TypedNode<"Float">, "type" | "location">,
  location: LocationRange
): TypedNode<"Float"> {
  return { type: "Float", ...args, location };
}

export function nodeIdentifier(
  value: string,
  location: LocationRange
): TypedNode<"Identifier"> {
  return { type: "Identifier", value, location };
}

export function nodeIdentifierWithAnnotation(
  variable: string,
  annotation: ASTNode,
  location: LocationRange
): TypedNode<"IdentifierWithAnnotation"> {
  return { type: "IdentifierWithAnnotation", variable, annotation, location };
}

export function nodeKeyValue(
  key: ASTNode,
  value: ASTNode,
  location: LocationRange
): TypedNode<"KeyValue"> {
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
  name?: TypedNode<"Identifier">
): TypedNode<"Lambda"> {
  return { type: "Lambda", args, body, location, name: name?.value };
}
export function nodeLetStatement(
  decorators: TypedNode<"Decorator">[],
  variable: TypedNode<"Identifier">,
  value: ASTNode,
  exported: boolean,
  location: LocationRange
): TypedNode<"LetStatement"> {
  const patchedValue =
    value.type === "Lambda" ? { ...value, name: variable.value } : value;
  return {
    type: "LetStatement",
    decorators,
    variable,
    value: patchedValue,
    exported,
    location,
  };
}
export function nodeDefunStatement(
  decorators: TypedNode<"Decorator">[],
  variable: TypedNode<"Identifier">,
  value: NamedNodeLambda,
  exported: boolean,
  location: LocationRange
): TypedNode<"DefunStatement"> {
  return {
    type: "DefunStatement",
    decorators,
    variable,
    value,
    exported,
    location,
  };
}

export function nodeDecorator(
  name: TypedNode<"Identifier">,
  args: ASTNode[],
  location: LocationRange
): TypedNode<"Decorator"> {
  return { type: "Decorator", name, args, location };
}

export function nodeString(
  value: string,
  location: LocationRange
): TypedNode<"String"> {
  return { type: "String", value, location };
}

export function nodeTernary(
  condition: ASTNode,
  trueExpression: ASTNode,
  falseExpression: ASTNode,
  kind: TypedNode<"Ternary">["kind"],
  location: LocationRange
): TypedNode<"Ternary"> {
  return {
    type: "Ternary",
    condition,
    trueExpression,
    falseExpression,
    kind,
    location,
  };
}

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
