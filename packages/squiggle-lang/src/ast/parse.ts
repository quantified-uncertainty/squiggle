import { LocationRange } from "peggy";
import * as Result from "../utility/result.js";
import { result } from "../utility/result.js";
import { type ASTCommentNode, type ASTNode } from "./peggyHelpers.js";

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

export type AST = Extract<ASTNode, { type: "Program" }> & {
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
    if (parsed.type !== "Program") {
      throw new Error("Expected parse to result in a Program node");
    }
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
  const sExpr = (components: (ASTNode | string)[]) =>
    "(" +
    node.type +
    (components.length ? " " : "") +
    components
      .map((component) =>
        typeof component === "string" ? component : nodeToString(component)
      )
      .join(" ") +
    ")";

  switch (node.type) {
    case "Block":
    case "Program":
      return sExpr(node.statements);
    case "Array":
      return sExpr(node.elements);
    case "Dict":
      return sExpr(node.elements);
    case "Boolean":
      return String(node.value);
    case "Call":
      return sExpr([node.fn, ...node.args]);
    case "InfixCall":
      return sExpr([node.op, ...node.args]);
    case "Pipe":
      return sExpr([node.leftArg, node.fn, ...node.rightArgs]);
    case "DotLookup":
      return sExpr([node.arg, node.key]);
    case "BracketLookup":
      return sExpr([node.arg, node.key]);
    case "UnaryCall":
      return sExpr([node.op, node.arg]);
    case "Float":
      // see also: "Float" branch in expression/compile.ts
      return `${node.integer}${
        node.fractional === null ? "" : `.${node.fractional}`
      }${node.exponent === null ? "" : `e${node.exponent}`}`;
    case "Identifier":
      return `:${node.value}`;
    case "IdentifierWithAnnotation":
      return sExpr([node.variable, node.annotation]);
    case "KeyValue":
      return sExpr([node.key, node.value]);
    case "Lambda":
      return sExpr([...node.args, node.body]);
    case "LetStatement":
      return node.exported
        ? sExpr(["export", node.variable, node.value])
        : sExpr([node.variable, node.value]);
    case "DefunStatement":
      return sExpr([node.variable, node.value]);
    case "String":
      return `'${node.value}'`; // TODO - quote?
    case "Ternary":
      return sExpr([node.condition, node.trueExpression, node.falseExpression]);
    case "Void":
      return "()";
    case "UnitValue":
      // S-expression; we should migrate to S-expressions for other branches too, for easier testing.
      return sExpr([node.value, node.unit]);

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
