import { LocationRange } from "peggy";
import { result } from "../utility/result";
import * as Result from "../utility/result";
import { AnyPeggyNode } from "./peggyHelpers";

import {
  parse as peggyParse,
  SyntaxError as PeggySyntaxError,
} from "./peggyParser";

export type ParseError = {
  type: "SyntaxError";
  location: LocationRange;
  message: string;
};

export const makeParseError = (
  message: string,
  location: LocationRange
): ParseError => ({
  type: "SyntaxError",
  message,
  location,
});

type ParseResult = result<AST, ParseError>;

export const parse = (expr: string, source: string): ParseResult => {
  try {
    return Result.Ok(peggyParse(expr, { grammarSource: source }));
  } catch (e) {
    if (e instanceof PeggySyntaxError) {
      return Result.Error({
        type: "SyntaxError",
        location: (e as any).location,
        message: (e as any).message,
      });
    } else {
      throw e;
    }
  }
};

export type AST = AnyPeggyNode;

const nodeToString = (node: AnyPeggyNode): string => {
  switch (node.type) {
    case "Block":
    case "Program":
      return "{" + node.statements.map(nodeToString).join("; ") + "}";
    case "Array":
      return "[" + node.elements.map(nodeToString).join("; ") + "]";
    case "Record":
      return "{" + node.elements.map(nodeToString).join(", ") + "}";
    case "Boolean":
      return String(node.value);
    case "Call":
      return (
        "(" +
        nodeToString(node.fn) +
        " " +
        node.args.map(nodeToString).join(" ") +
        ")"
      );
    case "Float":
      return String(node.value);
    case "Identifier":
      return `:${node.value}`;
    case "Integer":
      return String(node.value);
    case "KeyValue":
      return nodeToString(node.key) + ": " + nodeToString(node.value);
    case "Lambda":
      return (
        "{|" +
        node.args.map(nodeToString).join(",") +
        "| " +
        nodeToString(node.body) +
        "}"
      );
    case "LetStatement":
      return nodeToString(node.variable) + " = " + nodeToString(node.value);
    case "ModuleIdentifier":
      return `@${node.value}`;
    case "String":
      return `'${node.value}'`; // TODO - quote?
    case "Ternary":
      return (
        "(::$$_ternary_$$ " +
        nodeToString(node.condition) +
        " " +
        nodeToString(node.trueExpression) +
        " " +
        nodeToString(node.falseExpression) +
        ")"
      );
    case "Void":
      return "()";
    default:
      // should never happen
      throw new Error(`Unknown node ${node}`);
  }
};

export const toStringError = (error: ParseError): string => {
  return `Syntax Error: ${error.message}}`;
};

export const nodeResultToString = (r: ParseResult): string => {
  if (!r.ok) {
    return toStringError(r.value);
  }
  return nodeToString(r.value);
};
