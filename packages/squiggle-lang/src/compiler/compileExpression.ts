import { AnyExpressionNode } from "../analysis/types.js";
import { infixFunctions, unaryFunctions } from "../ast/operators.js";
import { ICompileError } from "../errors/IError.js";
import { vBool } from "../value/VBool.js";
import { vNumber } from "../value/VNumber.js";
import { vString } from "../value/VString.js";
import { compileStatement } from "./compileStatement.js";
import { INDEX_LOOKUP_FUNCTION } from "./constants.js";
import { CompileContext } from "./context.js";
import {
  AnyExpressionIR,
  AnyExpressionIRContent,
  eCall,
  LambdaIRParameter,
  make,
  StatementIR,
} from "./types.js";

function compileExpressionContent(
  ast: AnyExpressionNode,
  context: CompileContext
): AnyExpressionIRContent {
  switch (ast.kind) {
    case "Block": {
      if (ast.statements.length === 0) {
        // unwrap blocks; no need for extra scopes or Block IR nodes.
        return compileExpression(ast.result, context);
      }
      context.startScope();
      const statements: StatementIR[] = [];
      for (const astStatement of ast.statements) {
        if (astStatement.exported) {
          throw new ICompileError(
            "Exports aren't allowed in blocks",
            astStatement.location
          );
        }
        const statement = compileStatement(astStatement, context);
        statements.push(statement);
      }
      const result = compileExpression(ast.result, context);
      context.finishScope();
      return make("Block", { statements, result });
    }
    case "Call": {
      return eCall(
        compileExpression(ast.fn, context),
        ast.args.map((arg) => compileExpression(arg, context))
      );
    }
    case "InfixCall": {
      return eCall(
        context.resolveName(ast.location, infixFunctions[ast.op]),
        ast.args.map((arg) => compileExpression(arg, context))
      );
    }
    case "UnaryCall":
      return eCall(context.resolveName(ast.location, unaryFunctions[ast.op]), [
        compileExpression(ast.arg, context),
      ]);
    case "Pipe":
      return eCall(compileExpression(ast.fn, context), [
        compileExpression(ast.leftArg, context),
        ...ast.rightArgs.map((arg) => compileExpression(arg, context)),
      ]);
    case "DotLookup":
      return eCall(context.resolveName(ast.location, INDEX_LOOKUP_FUNCTION), [
        compileExpression(ast.arg, context),
        {
          location: ast.location,
          ...make("Value", vString(ast.key)),
        },
      ]);
    case "BracketLookup":
      return eCall(context.resolveName(ast.location, INDEX_LOOKUP_FUNCTION), [
        compileExpression(ast.arg, context),
        compileExpression(ast.key, context),
      ]);
    case "Lambda": {
      const parameters: LambdaIRParameter[] = [];
      for (const astParameter of ast.args) {
        parameters.push({
          name: astParameter.variable.value,
          annotation: astParameter.annotation
            ? compileExpression(astParameter.annotation, context)
            : undefined,
        });
      }

      // It's important that we start function scope after we've collected all
      // parameters. Parameter annotations can include expressions, and those
      // should be compiled and evaluated in the outer scope, not when the
      // function is called.
      // See also: https://github.com/quantified-uncertainty/squiggle/issues/3141
      context.startFunctionScope();
      for (const parameter of parameters) {
        context.defineLocal(parameter.name);
      }

      const body = compileExpression(ast.body, context);
      const captures = context.currentScopeCaptures();
      context.finishScope();
      return make("Lambda", {
        name: ast.name ?? undefined,
        captures,
        parameters,
        body,
      });
    }
    case "Ternary":
      return make("Ternary", {
        condition: compileExpression(ast.condition, context),
        ifTrue: compileExpression(ast.trueExpression, context),
        ifFalse: compileExpression(ast.falseExpression, context),
      });
    case "Array":
      return make(
        "Array",
        ast.elements.map((statement) => compileExpression(statement, context))
      );
    case "Dict":
      return make(
        "Dict",
        ast.elements.map((kv): [AnyExpressionIR, AnyExpressionIR] => {
          if (kv.kind === "KeyValue") {
            return [
              compileExpression(kv.key, context),
              compileExpression(kv.value, context),
            ];
          } else if (kv.kind === "Identifier") {
            // shorthand
            const key = {
              location: kv.location,
              ...make("Value", vString(kv.value)),
            };
            const value = context.resolveName(kv.location, kv.value);
            return [key, value];
          } else {
            throw new Error(
              `Internal AST error: unexpected kv ${kv satisfies never}`
            );
          }
        })
      );
    case "Boolean":
      return make("Value", vBool(ast.value));
    case "Float": {
      const value = parseFloat(
        `${ast.integer}${ast.fractional === null ? "" : `.${ast.fractional}`}${
          ast.exponent === null ? "" : `e${ast.exponent}`
        }`
      );
      if (Number.isNaN(value)) {
        throw new ICompileError("Failed to compile a number", ast.location);
      }
      return make("Value", vNumber(value));
    }
    case "String":
      return make("Value", vString(ast.value));
    case "Identifier": {
      return context.resolveName(ast.location, ast.value);
    }
    case "UnitValue": {
      const fromUnitFn = context.resolveName(
        ast.location,
        `fromUnit_${ast.unit}`
      );
      return eCall(fromUnitFn, [compileExpression(ast.value, context)]);
    }
    default: {
      const badAst = ast satisfies never;
      throw new Error(`Unsupported AST value ${JSON.stringify(badAst)}`);
    }
  }
}

export function compileExpression(
  ast: AnyExpressionNode,
  context: CompileContext
): AnyExpressionIR {
  const content = compileExpressionContent(ast, context);
  return {
    ...content,
    location: ast.location,
  };
}
