import { List as ImmutableList } from "immutable";

import { ASTNode } from "../ast/parse.js";
import { infixFunctions, unaryFunctions } from "../ast/peggyHelpers.js";
import { ICompileError } from "../errors/IError.js";
import { Bindings } from "../reducer/stack.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import * as Result from "../utility/result.js";
import { vBool, vNumber, vString } from "../value/index.js";
import { INDEX_LOOKUP_FUNCTION } from "./constants.js";
import * as expression from "./index.js";

type CompileContext = Readonly<{
  // Externals will include:
  // 1. stdLib symbols
  // 2. "continues"
  // 3. imports
  // Externals will be inlined in the resulting expression.
  externals: Bindings;
  // `pos` here is counted from the first element on stack, unlike in ResolvedSymbol's offset.
  // See switch branch for "Identifier" AST type below.
  nameToPos: ImmutableMap<string, number>;
  locals: ImmutableList<string>;
  size: number;
}>;

function createInitialCompileContext(externals: Bindings): CompileContext {
  return {
    externals,
    nameToPos: ImmutableMap(),
    locals: ImmutableList(),
    size: 0,
  };
}

function getValueOrThrow(context: CompileContext, ast: ASTNode, name: string) {
  const value = context.externals.get(name);
  if (value === undefined) {
    throw new ICompileError(`${name} is not defined`, ast.location);
  }
  return expression.eValue(value);
}

function compileToContent(
  ast: ASTNode,
  context: CompileContext
): [expression.ExpressionContent, CompileContext] {
  switch (ast.type) {
    case "Block": {
      let currentContext: CompileContext = {
        externals: context.externals,
        nameToPos: context.nameToPos,
        locals: ImmutableList(),
        size: context.size,
      };
      const statements: expression.Expression[] = [];
      for (const astStatement of ast.statements) {
        const [statement, newContext] = innerCompileAst(
          astStatement,
          currentContext
        );
        statements.push(statement);
        currentContext = newContext;
      }
      return [expression.eBlock(statements), context];
    }
    case "Program": {
      let currentContext: CompileContext = {
        externals: context.externals,
        nameToPos: context.nameToPos,
        locals: ImmutableList(),
        size: context.size,
      };
      const statements: expression.Expression[] = [];
      for (const astStatement of ast.statements) {
        const [statement, newContext] = innerCompileAst(
          astStatement,
          currentContext
        );
        statements.push(statement);
        currentContext = newContext;
      }
      return [expression.eProgram(statements), currentContext];
    }
    case "DefunStatement":
    case "LetStatement": {
      const newContext: CompileContext = {
        externals: context.externals,
        nameToPos: context.nameToPos.set(ast.variable.value, context.size),
        locals: context.locals.push(ast.variable.value),
        size: context.size + 1,
      };
      return [
        expression.eLetStatement(
          ast.variable.value,
          innerCompileAst(ast.value, context)[0]
        ),
        newContext,
      ];
    }
    case "Call": {
      return [
        expression.eCall(
          innerCompileAst(ast.fn, context)[0],
          ast.args.map((arg) => innerCompileAst(arg, context)[0])
        ),
        context,
      ];
    }
    case "InfixCall": {
      return [
        expression.eCall(
          { ast, ...getValueOrThrow(context, ast, infixFunctions[ast.op]) },
          ast.args.map((arg) => innerCompileAst(arg, context)[0])
        ),
        context,
      ];
    }
    case "UnaryCall":
      return [
        expression.eCall(
          { ast, ...getValueOrThrow(context, ast, unaryFunctions[ast.op]) },
          [innerCompileAst(ast.arg, context)[0]]
        ),
        context,
      ];
    case "Pipe":
      return [
        expression.eCall(innerCompileAst(ast.fn, context)[0], [
          innerCompileAst(ast.leftArg, context)[0],
          ...ast.rightArgs.map((arg) => innerCompileAst(arg, context)[0]),
        ]),
        context,
      ];
    case "DotLookup":
      return [
        expression.eCall(
          { ast, ...getValueOrThrow(context, ast, INDEX_LOOKUP_FUNCTION) },
          [
            innerCompileAst(ast.arg, context)[0],
            { ast, ...expression.eValue(vString(ast.key)) },
          ]
        ),
        context,
      ];
    case "BracketLookup":
      return [
        expression.eCall(
          { ast, ...getValueOrThrow(context, ast, INDEX_LOOKUP_FUNCTION) },
          [
            innerCompileAst(ast.arg, context)[0],
            innerCompileAst(ast.key, context)[0],
          ]
        ),
        context,
      ];
    case "Lambda": {
      let newNameToPos = context.nameToPos;
      const args: string[] = [];
      for (let i = 0; i < ast.args.length; i++) {
        const arg = ast.args[i];
        if (arg.type !== "Identifier") {
          throw new ICompileError(
            "Argument is not an identifier",
            ast.location
          );
        }
        args.push(arg.value);
        newNameToPos = newNameToPos.set(arg.value, context.size + i);
      }
      const innerContext: CompileContext = {
        externals: context.externals,
        nameToPos: newNameToPos,
        locals: ImmutableList(),
        size: context.size + ast.args.length,
      };
      return [
        expression.eLambda(
          ast.name,
          args,
          innerCompileAst(ast.body, innerContext)[0]
        ),
        context,
      ];
    }
    case "KeyValue":
      return [
        expression.eArray([
          innerCompileAst(ast.key, context)[0],
          innerCompileAst(ast.value, context)[0],
        ]),
        context,
      ];
    case "Ternary":
      return [
        expression.eTernary(
          innerCompileAst(ast.condition, context)[0],
          innerCompileAst(ast.trueExpression, context)[0],
          innerCompileAst(ast.falseExpression, context)[0]
        ),
        context,
      ];
    case "Array":
      return [
        expression.eArray(
          ast.elements.map(
            (statement) => innerCompileAst(statement, context)[0]
          )
        ),
        context,
      ];
    case "Record":
      return [
        expression.eRecord(
          ast.elements.map((kv) => [
            innerCompileAst(kv.key, context)[0],
            innerCompileAst(kv.value, context)[0],
          ])
        ),
        context,
      ];
    case "Boolean":
      return [expression.eValue(vBool(ast.value)), context];
    case "Float": {
      const value = parseFloat(
        `${ast.integer}${ast.fractional === null ? "" : `.${ast.fractional}`}${
          ast.exponent === null ? "" : `e${ast.exponent}`
        }`
      );
      if (Number.isNaN(value)) {
        throw new ICompileError("Failed to compile a number", ast.location);
      }
      return [expression.eValue(vNumber(value)), context];
    }
    case "String":
      return [expression.eValue(vString(ast.value)), context];
    case "Void":
      return [expression.eVoid(), context];
    case "Identifier": {
      const offset = context.nameToPos.get(ast.value);
      if (offset === undefined) {
        return [getValueOrThrow(context, ast, ast.value), context];
      } else {
        const result = expression.eResolvedSymbol(
          ast.value,
          context.size - 1 - offset
        );
        return [result, context];
      }
    }
    case "UnitValue": {
      const fromUnitFn = getValueOrThrow(context, ast, `fromUnit_${ast.unit}`);
      return [
        expression.eCall({ ast, ...fromUnitFn }, [
          innerCompileAst(ast.value, context)[0],
        ]),
        context,
      ];
    }
    default:
      throw new Error(`Unsupported AST value ${ast satisfies never}`);
  }
}

function innerCompileAst(
  ast: ASTNode,
  context: CompileContext
): [expression.Expression, CompileContext] {
  const [content, newContext] = compileToContent(ast, context);
  return [
    {
      ast,
      ...content,
    },
    newContext,
  ];
}

export function compileAst(
  ast: ASTNode,
  externals: Bindings
): Result.result<expression.Expression, ICompileError> {
  try {
    const [expression] = innerCompileAst(
      ast,
      createInitialCompileContext(externals)
    );
    return Result.Ok(expression);
  } catch (err) {
    if (err instanceof ICompileError) {
      return Result.Err(err);
    }
    throw err; // internal error, better to detect early (but maybe we should wrap this in IOtherError instead)
  }
}
