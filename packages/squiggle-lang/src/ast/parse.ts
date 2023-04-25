import { LocationRange } from "peggy";
import { result } from "../utility/result.js";
import * as Result from "../utility/result.js";
import { AnyPeggyNode, ASTCommentNode } from "./peggyHelpers.js";

import {
  parse as peggyParse,
  SyntaxError as PeggySyntaxError,
} from "./peggyParser.js";

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

export type AST = AnyPeggyNode & {
  comments: ASTCommentNode[];
};

export type ASTNode = AnyPeggyNode;

type ParseResult = result<AST, ParseError>;

export const parse = (expr: string, source: string): ParseResult => {
  try {
    const comments: ASTCommentNode[] = [];
    const parsed: AST = peggyParse(expr, {
      grammarSource: source,
      comments,
    });
    parsed.comments = comments;
    return Result.Ok(parsed);
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

// This function is just for the sake of tests.
// For real generation of Squiggle code from AST try our prettier plugin.
const nodeToString = (node: ASTNode): string => {
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
    case "InfixCall":
      return (
        "(" +
        nodeToString(node.args[0]) +
        " " +
        node.op +
        " " +
        nodeToString(node.args[1]) +
        ")"
      );
    case "DotLookup":
      return nodeToString(node.arg) + "." + node.key;
    case "BracketLookup":
      return nodeToString(node.arg) + "[" + nodeToString(node.key) + "]";
    case "UnaryCall":
      return "(" + node.op + nodeToString(node.arg) + ")";
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
    case "DefunStatement":
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
      throw new Error(`Unknown node: ${node satisfies never}`);
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
