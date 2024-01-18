import { List as ImmutableList } from "immutable";

import { ASTNode } from "../ast/parse.js";
import { infixFunctions, unaryFunctions } from "../ast/peggyHelpers.js";
import { ICompileError } from "../errors/IError.js";
import { Bindings } from "../reducer/stack.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import * as Result from "../utility/result.js";
import { vBool } from "../value/VBool.js";
import { vNumber } from "../value/VNumber.js";
import { vString } from "../value/VString.js";
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

function resolveName(
  context: CompileContext,
  ast: ASTNode,
  name: string
): expression.Expression {
  const offset = context.nameToPos.get(name);
  if (offset !== undefined) {
    return {
      ast,
      ...expression.eResolvedSymbol(name, context.size - 1 - offset),
    };
  }

  const value = context.externals.get(name);
  if (value !== undefined) {
    return {
      ast,
      ...expression.eValue(value),
    };
  }

  throw new ICompileError(`${name} is not defined`, ast.location);
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
        if (
          (astStatement.type === "LetStatement" ||
            astStatement.type === "DefunStatement") &&
          astStatement.exported
        ) {
          throw new ICompileError(
            "Exports aren't allowed in blocks",
            astStatement.location
          );
        }
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
      const exports: string[] = [];
      for (const astStatement of ast.statements) {
        const [statement, newContext] = innerCompileAst(
          astStatement,
          currentContext
        );
        statements.push(statement);
        {
          let maybeExportedStatement = astStatement;
          while (maybeExportedStatement.type === "DecoratedStatement") {
            maybeExportedStatement = maybeExportedStatement.statement;
          }
          if (
            (maybeExportedStatement.type === "LetStatement" ||
              maybeExportedStatement.type === "DefunStatement") &&
            maybeExportedStatement.exported
          ) {
            exports.push(maybeExportedStatement.variable.value);
          }
        }
        currentContext = newContext;
      }
      return [expression.eProgram(statements, exports), currentContext];
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
    case "DecoratedStatement": {
      // First, compile the inner statement.
      // `newContext` includes the new binding.
      const [innerExpression, newContext] = innerCompileAst(
        ast.statement,
        context
      );
      if (innerExpression.type !== "Assign") {
        // Shouldn't happen, `ast.statement` is always compiled to `Assign`
        throw new ICompileError(
          "Can't apply a decorator to non-Assign expression",
          ast.location
        );
      }
      // Then wrap it in a function call.
      const decoratorFn = resolveName(
        context,
        ast,
        `Tag.${ast.decorator.name.value}`
      );
      return [
        expression.eLetStatement(innerExpression.value.left, {
          ast: ast.statement,
          ...expression.eCall(
            decoratorFn,
            [
              innerExpression.value.right,
              ...ast.decorator.args.map(
                (arg) => innerCompileAst(arg, context)[0]
              ),
            ],
            "decorate"
          ),
        }),
        newContext,
      ];
    }
    case "Decorator":
      throw new ICompileError("Can't compile Decorator node", ast.location);
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
          resolveName(context, ast, infixFunctions[ast.op]),
          ast.args.map((arg) => innerCompileAst(arg, context)[0])
        ),
        context,
      ];
    }
    case "UnaryCall":
      return [
        expression.eCall(resolveName(context, ast, unaryFunctions[ast.op]), [
          innerCompileAst(ast.arg, context)[0],
        ]),
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
        expression.eCall(resolveName(context, ast, INDEX_LOOKUP_FUNCTION), [
          innerCompileAst(ast.arg, context)[0],
          { ast, ...expression.eValue(vString(ast.key)) },
        ]),
        context,
      ];
    case "BracketLookup":
      return [
        expression.eCall(resolveName(context, ast, INDEX_LOOKUP_FUNCTION), [
          innerCompileAst(ast.arg, context)[0],
          innerCompileAst(ast.key, context)[0],
        ]),
        context,
      ];
    case "Lambda": {
      let newNameToPos = context.nameToPos;
      const args: expression.LambdaExpressionParameter[] = [];
      for (let i = 0; i < ast.args.length; i++) {
        const astArg = ast.args[i];

        let arg: expression.LambdaExpressionParameter;
        if (astArg.type === "Identifier") {
          arg = { name: astArg.value, annotation: undefined };
        } else if (astArg.type === "IdentifierWithAnnotation") {
          arg = {
            name: astArg.variable,
            annotation: innerCompileAst(astArg.annotation, context)[0],
          };
        } else {
          // should never happen
          throw new ICompileError(
            `Internal error: argument ${astArg.type} is not an identifier`,
            ast.location
          );
        }
        args.push(arg);
        newNameToPos = newNameToPos.set(arg.name, context.size + i);
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
    case "Dict":
      return [
        expression.eDict(
          ast.elements.map((kv) => {
            if (kv.type === "KeyValue") {
              return [
                innerCompileAst(kv.key, context)[0],
                innerCompileAst(kv.value, context)[0],
              ];
            } else if (kv.type === "Identifier") {
              // shorthand
              const key = { ast: kv, ...expression.eValue(vString(kv.value)) };
              const value = resolveName(context, kv, kv.value);
              return [key, value];
            } else {
              throw new Error(
                `Internal AST error: unexpected kv ${kv satisfies never}`
              ); // parsed to incorrect AST, shouldn't happen
            }
          })
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
        return [resolveName(context, ast, ast.value), context];
      } else {
        const result = expression.eResolvedSymbol(
          ast.value,
          context.size - 1 - offset
        );
        return [result, context];
      }
    }
    case "UnitValue": {
      const fromUnitFn = resolveName(context, ast, `fromUnit_${ast.unit}`);
      return [
        expression.eCall(fromUnitFn, [innerCompileAst(ast.value, context)[0]]),
        context,
      ];
    }
    case "IdentifierWithAnnotation":
      // should never happen
      throw new ICompileError(
        "Can't compile IdentifierWithAnnotation outside of lambda declaration",
        ast.location
      );
    default: {
      const badAst = ast satisfies never;
      throw new Error(`Unsupported AST value ${JSON.stringify(badAst)}`);
    }
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
