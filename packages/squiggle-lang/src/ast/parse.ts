import { ICompileError } from "../errors/IError.js";
import * as Result from "../utility/result.js";
import { result } from "../utility/result.js";
import {
  sExpr,
  SExpr,
  SExprPrintOptions,
  sExprToString,
} from "../utility/sExpr.js";
import {
  parse as peggyParse,
  SyntaxError as PeggySyntaxError,
} from "./peggyParser.js";
import {
  AST,
  type ASTCommentNode,
  ASTNode,
  LocationRange,
  ParseOptions,
} from "./types.js";

export type ParseError = {
  type: "SyntaxError";
  location: LocationRange;
  message: string;
};

export type ASTResult = result<AST, ICompileError[]>;

function codeToFullLocationRange(
  code: string,
  sourceId: string
): LocationRange {
  const lines = code.split("\n");
  return {
    start: {
      line: 1,
      column: 1,
      offset: 0,
    },
    end: {
      line: lines.length,
      column: lines.at(-1)?.length ?? 1,
      offset: code.length,
    },
    source: sourceId,
  };
}

export function parse(expr: string, sourceId: string): ASTResult {
  try {
    const comments = new Map<string, ASTCommentNode>();

    const parsed: AST = peggyParse(expr, {
      grammarSource: sourceId,
      addComment: (comment) => {
        // deduplicate comments - Peggy can backtrack, so we can't collect comments in an array
        const key = `${comment.location.start.offset}-${comment.location.end.offset}`;
        comments.set(key, comment);
      },
    } satisfies ParseOptions);
    if (parsed.kind !== "Program") {
      throw new Error("Expected parse to result in a Program node");
    }

    parsed.comments = [...comments.values()];

    return Result.Ok(parsed);
  } catch (e) {
    if (e instanceof PeggySyntaxError) {
      return Result.Err([
        new ICompileError((e as any).message, (e as any).location),
      ]);
    } else if (e instanceof ICompileError) {
      return Result.Err([e]);
    } else {
      return Result.Err([
        new ICompileError(String(e), codeToFullLocationRange(expr, sourceId)),
      ]);
    }
  }
}

// This function is just for the sake of tests.
// For real generation of Squiggle code from AST try our prettier plugin.
export function astNodeToString(
  node: ASTNode,
  printOptions: SExprPrintOptions = {}
): string {
  const toSExpr = (node: ASTNode): SExpr => {
    const selfExpr = (components: (SExpr | null | undefined)[]): SExpr => ({
      name: node.kind,
      args: components,
    });

    switch (node.kind) {
      case "Program":
        return selfExpr([
          node.imports.length
            ? sExpr(".imports", node.imports.map(toSExpr))
            : undefined,
          ...node.statements.map(toSExpr),
          node.result ? toSExpr(node.result) : undefined,
        ]);
      case "Import":
        return selfExpr([toSExpr(node.path), toSExpr(node.variable)]);
      case "Block":
        return selfExpr([
          ...node.statements.map(toSExpr),
          toSExpr(node.result),
        ]);
      case "Array":
        return selfExpr(node.elements.map(toSExpr));
      case "Dict":
        return selfExpr(node.elements.map(toSExpr));
      case "Boolean":
        return String(node.value);
      case "Call":
        return selfExpr([node.fn, ...node.args].map(toSExpr));
      case "InfixCall":
        return selfExpr([node.op, ...node.args.map(toSExpr)]);
      case "Pipe":
        return selfExpr(
          [node.leftArg, node.fn, ...node.rightArgs].map(toSExpr)
        );
      case "DotLookup":
        return selfExpr([toSExpr(node.arg), node.key]);
      case "BracketLookup":
        return selfExpr([node.arg, node.key].map(toSExpr));
      case "UnaryCall":
        return selfExpr([node.op, toSExpr(node.arg)]);
      case "Float":
        // see also: "Float" branch in compiler/compile.ts
        return `${node.integer}${
          node.fractional === null ? "" : `.${node.fractional}`
        }${node.exponent === null ? "" : `e${node.exponent}`}`;
      case "Identifier":
        return `:${node.value}`;
      case "LambdaParameter":
        if (!node.annotation && !node.unitTypeSignature) {
          return `:${node.variable.value}`;
        }
        return selfExpr([
          node.variable.value,
          node.annotation && toSExpr(node.annotation),
          node.unitTypeSignature && toSExpr(node.unitTypeSignature),
        ]);
      case "KeyValue":
        return selfExpr([node.key, node.value].map(toSExpr));
      case "Lambda":
        return selfExpr([
          ...node.args.map(toSExpr),
          toSExpr(node.body),
          node.returnUnitType ? toSExpr(node.returnUnitType) : undefined,
        ]);
      case "Decorator":
        return selfExpr([node.name, ...node.args].map(toSExpr));
      case "LetStatement":
        return selfExpr([
          toSExpr(node.variable),
          node.unitTypeSignature ? toSExpr(node.unitTypeSignature) : undefined,
          toSExpr(node.value),
          node.exported ? "exported" : undefined,
          ...node.decorators.map(toSExpr),
        ]);
      case "DefunStatement":
        return selfExpr([
          toSExpr(node.variable),
          toSExpr(node.value),
          node.exported ? "exported" : undefined,
          ...node.decorators.map(toSExpr),
        ]);
      case "String":
        return `'${node.value}'`; // TODO - quote?
      case "Ternary":
        return selfExpr(
          [node.condition, node.trueExpression, node.falseExpression].map(
            toSExpr
          )
        );
      case "UnitValue":
        return selfExpr([toSExpr(node.value), node.unit]);
      case "UnitTypeSignature":
        return selfExpr([toSExpr(node.body)]);
      case "InfixUnitType":
        return selfExpr([node.op, ...node.args.map(toSExpr)]);
      case "ExponentialUnitType":
        return selfExpr([
          toSExpr(node.base),
          node.exponent !== undefined ? toSExpr(node.exponent) : undefined,
        ]);
      case "UnitName":
        return selfExpr([node.value]);
      default:
        throw new Error(`Unknown node: ${node satisfies never}`);
    }
  };

  return sExprToString(toSExpr(node), printOptions);
}

export function astResultToString(
  r: result<AST, ICompileError[]>,
  options?: SExprPrintOptions
): string {
  if (!r.ok) {
    return r.value.toString();
  }
  return astNodeToString(r.value, options);
}
