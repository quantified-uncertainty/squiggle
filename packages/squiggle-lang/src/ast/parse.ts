import { ICompileError } from "../errors/IError.js";
import * as Result from "../utility/result.js";
import { result } from "../utility/result.js";
import { SExpr, SExprPrintOptions, sExprToString } from "../utility/sExpr.js";
import { type ASTCommentNode, type ASTNode } from "./peggyHelpers.js";
import {
  parse as peggyParse,
  SyntaxError as PeggySyntaxError,
} from "./peggyParser.js";

export { type ASTNode } from "./peggyHelpers.js";

// Types copy-pasted from Peggy, but converted from interface to type.
// We need a type because interfaces don't match JsonValue type that we use for serialization.

/** Provides information pointing to a location within a source. */
export type Location = {
  /** Line in the parsed source (1-based). */
  line: number;
  /** Column in the parsed source (1-based). */
  column: number;
  /** Offset in the parsed source (0-based). */
  offset: number;
};

/** The `start` and `end` position's of an object within the source. */
export type LocationRange = {
  /** Unlike in Peggy, this must be a string. */
  source: string;
  /** Position at the beginning of the expression. */
  start: Location;
  /** Position after the end of the expression. */
  end: Location;
};

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
export function nodeToString(
  node: ASTNode,
  printOptions: SExprPrintOptions = {}
): string {
  const toSExpr = (node: ASTNode): SExpr => {
    const sExpr = (components: (SExpr | undefined)[]): SExpr => ({
      name: node.type,
      args: components,
    });

    switch (node.type) {
      case "Block":
      case "Program":
        return sExpr(node.statements.map(toSExpr));
      case "Array":
        return sExpr(node.elements.map(toSExpr));
      case "Dict":
        return sExpr(node.elements.map(toSExpr));
      case "Boolean":
        return String(node.value);
      case "Call":
        return sExpr([node.fn, ...node.args].map(toSExpr));
      case "InfixCall":
        return sExpr([node.op, ...node.args.map(toSExpr)]);
      case "Pipe":
        return sExpr([node.leftArg, node.fn, ...node.rightArgs].map(toSExpr));
      case "DotLookup":
        return sExpr([toSExpr(node.arg), node.key]);
      case "BracketLookup":
        return sExpr([node.arg, node.key].map(toSExpr));
      case "UnaryCall":
        return sExpr([node.op, toSExpr(node.arg)]);
      case "Float":
        // see also: "Float" branch in expression/compile.ts
        return `${node.integer}${
          node.fractional === null ? "" : `.${node.fractional}`
        }${node.exponent === null ? "" : `e${node.exponent}`}`;
      case "Identifier":
        return `:${node.value}`;
      case "IdentifierWithAnnotation":
        return sExpr([node.variable, toSExpr(node.annotation)]);
      case "KeyValue":
        return sExpr([node.key, node.value].map(toSExpr));
      case "Lambda":
        return sExpr([...node.args, node.body].map(toSExpr));
      case "Decorator":
        return sExpr([node.name, ...node.args].map(toSExpr));
      case "DecoratedStatement":
        return sExpr([node.decorator, node.statement].map(toSExpr));
      case "LetStatement":
        return sExpr([
          node.exported ? "export" : undefined,
          toSExpr(node.variable),
          toSExpr(node.value),
        ]);
      case "DefunStatement":
        return sExpr([node.variable, node.value].map(toSExpr));
      case "String":
        return `'${node.value}'`; // TODO - quote?
      case "Ternary":
        return sExpr(
          [node.condition, node.trueExpression, node.falseExpression].map(
            toSExpr
          )
        );
      case "UnitValue":
        return sExpr([toSExpr(node.value), node.unit]);

      default:
        throw new Error(`Unknown node: ${node satisfies never}`);
    }
  };

  return sExprToString(toSExpr(node), printOptions);
}

export function nodeResultToString(
  r: ParseResult,
  printOptions?: SExprPrintOptions
): string {
  if (!r.ok) {
    return r.value.toString();
  }
  return nodeToString(r.value, printOptions);
}
