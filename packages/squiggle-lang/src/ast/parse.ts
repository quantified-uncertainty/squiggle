import { LocationRange } from "peggy";
import { rsResult } from "../rsResult";
import * as RSResult from "../rsResult";
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

type ParseResult = rsResult<AST, ParseError>;

export const parse = (expr: string, source: string): ParseResult => {
  try {
    return RSResult.Ok(peggyParse(expr, { grammarSource: source }));
  } catch (e) {
    if (e instanceof PeggySyntaxError) {
      return RSResult.Error({
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
  // let argsToString = (args: array<nodeIdentifier>): string =>
  //   args->E.A.fmap(arg => arg->nodeIdentifierToAST->pgToString)->Js.Array2.toString

  // let pgNodesToStringUsingSeparator = (nodes: array<ast>, separator: string): string =>
  //   nodes->E.A.fmap(pgToString)->Extra.Array.intersperse(separator)->Js.String.concatMany("")

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

const toStringError = (error: ParseError): string => {
  return `Syntax Error: ${error.message}}`;
};

const toStringResult = (r: ParseResult): string => {
  if (r.TAG === RSResult.E.Error) {
    return toStringError(r._0);
  } else {
    return nodeToString(r._0);
  }
};
