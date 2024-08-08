import { analyzeAst } from "../analysis/index.js";
import { TypedAST } from "../analysis/types.js";
import { ICompileError } from "../errors/IError.js";
import { Bindings } from "../reducer/Stack.js";
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
import { AST, type ASTCommentNode, ASTNode, LocationRange } from "./types.js";
import { unitTypeCheck } from "./unitTypeChecker.js";

export type ParseError = {
  type: "SyntaxError";
  location: LocationRange;
  message: string;
};

type ParseResult = result<TypedAST, ICompileError>;

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

export function parse(
  expr: string,
  sourceId: string,
  stdlib?: Bindings // stdlib is necessary for typechecking
): ParseResult {
  try {
    const comments: ASTCommentNode[] = [];
    const parsed: AST = peggyParse(expr, {
      grammarSource: sourceId,
      comments,
    });
    if (parsed.kind !== "Program") {
      throw new Error("Expected parse to result in a Program node");
    }

    // TODO - move code to analyzeAst stage
    unitTypeCheck(parsed);
    parsed.comments = comments;

    // TODO - do as a separate step
    const analyzed = analyzeAst(parsed, stdlib);

    return Result.Ok(analyzed);
  } catch (e) {
    if (e instanceof PeggySyntaxError) {
      return Result.Err(
        new ICompileError((e as any).message, (e as any).location)
      );
    } else if (e instanceof ICompileError) {
      return Result.Err(e);
    } else {
      return Result.Err(
        new ICompileError(String(e), codeToFullLocationRange(expr, sourceId))
      );
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
      case "UnitTypeSignature":
        return selfExpr([toSExpr(node.body)]);
      case "InfixUnitType":
        return selfExpr([node.op, ...node.args.map(toSExpr)]);
      case "ExponentialUnitType":
        return selfExpr([
          toSExpr(node.base),
          node.exponent !== undefined ? toSExpr(node.exponent) : undefined,
        ]);
      case "UnitValue":
        return selfExpr([toSExpr(node.value), node.unit]);

      default:
        throw new Error(`Unknown node: ${node satisfies never}`);
    }
  };

  return sExprToString(toSExpr(node), printOptions);
}
