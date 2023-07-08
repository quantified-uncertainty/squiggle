import { LocationRange } from "peggy";
import * as Result from "../utility/result.js";
import { result } from "../utility/result.js";
import { ASTCommentNode, type ASTNode } from "./peggyHelpers.js";

export { type ASTNode } from "./peggyHelpers.js";

import { ICompileError } from "../errors/IError.js";
import {
  SyntaxError as PeggySyntaxError,
  parse as peggyParse,
} from "./peggyParser.js";

export type ParseError = {
  type: "SyntaxError";
  location: LocationRange;
  message: string;
};

export type AST = ASTNode & {
  comments: ASTCommentNode[];
};

type ParseResult = result<AST, ICompileError>;

export function parse(expr: string, source: string): ParseResult {
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
      return Result.Err(
        new ICompileError((e as any).message, (e as any).location)
      );
    } else {
      throw e;
    }
  }
}

// This function is just for the sake of tests.
// For real generation of Squiggle code from AST try our prettier plugin.
function nodeToString(node: ASTNode): string {
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
    case "Pipe":
      return (
        "(" +
        nodeToString(node.leftArg) +
        " -> " +
        nodeToString(node.fn) +
        "(" +
        node.rightArgs.map(nodeToString).join(",") +
        "))"
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
    case "UnitValue":
      // S-expression; we should migrate to S-expressions for other branches too, for easier testing.
      return "(unit " + nodeToString(node.value) + " " + node.unit + ")";

    default:
      throw new Error(`Unknown node: ${node satisfies never}`);
  }
}

export function nodeResultToString(r: ParseResult): string {
  if (!r.ok) {
    return r.value.toString();
  }
  return nodeToString(r.value);
}
