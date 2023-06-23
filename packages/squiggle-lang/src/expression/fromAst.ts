import { List as ImmutableList } from "immutable";

import { ASTNode } from "../ast/parse.js";
import { infixFunctions, unaryFunctions } from "../ast/peggyHelpers.js";
import { RESymbolNotFound } from "../errors.js";
import { Bindings } from "../reducer/stack.js";
import { ImmutableMap } from "../utility/immutableMap.js";
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

function getValueOrThrow(context: CompileContext, name: string) {
  const value = context.externals.get(name);
  if (value === undefined) {
    throw new RESymbolNotFound(name);
  }
  return expression.eValue(value);
}

function contentFromNode(
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
        const [statement, newContext] = innerExpressionFromAst(
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
        const [statement, newContext] = innerExpressionFromAst(
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
          innerExpressionFromAst(ast.value, context)[0]
        ),
        newContext,
      ];
    }
    case "Call": {
      return [
        expression.eCall(
          innerExpressionFromAst(ast.fn, context)[0],
          ast.args.map((arg) => innerExpressionFromAst(arg, context)[0])
        ),
        context,
      ];
    }
    case "InfixCall": {
      return [
        expression.eCall(
          { ast, ...getValueOrThrow(context, infixFunctions[ast.op]) },
          ast.args.map((arg) => innerExpressionFromAst(arg, context)[0])
        ),
        context,
      ];
    }
    case "UnaryCall":
      return [
        expression.eCall(
          { ast, ...getValueOrThrow(context, unaryFunctions[ast.op]) },
          [innerExpressionFromAst(ast.arg, context)[0]]
        ),
        context,
      ];
    case "Pipe":
      return [
        expression.eCall(innerExpressionFromAst(ast.fn, context)[0], [
          innerExpressionFromAst(ast.leftArg, context)[0],
          ...ast.rightArgs.map(
            (arg) => innerExpressionFromAst(arg, context)[0]
          ),
        ]),
        context,
      ];
    case "DotLookup":
      return [
        expression.eCall(
          { ast, ...getValueOrThrow(context, INDEX_LOOKUP_FUNCTION) },
          [
            innerExpressionFromAst(ast.arg, context)[0],
            { ast, ...expression.eValue(vString(ast.key)) },
          ]
        ),
        context,
      ];
    case "BracketLookup":
      return [
        expression.eCall(
          { ast, ...getValueOrThrow(context, INDEX_LOOKUP_FUNCTION) },
          [
            innerExpressionFromAst(ast.arg, context)[0],
            innerExpressionFromAst(ast.key, context)[0],
          ]
        ),
        context,
      ];
    case "Lambda": {
      const innerContext: CompileContext = {
        externals: context.externals,
        nameToPos: ast.args.reduce(
          (map, arg, i) => map.set(arg, context.size + i),
          context.nameToPos
        ),
        locals: ImmutableList(),
        size: context.size + ast.args.length,
      };
      return [
        expression.eLambda(
          ast.name,
          ast.args,
          innerExpressionFromAst(ast.body, innerContext)[0]
        ),
        context,
      ];
    }
    case "KeyValue":
      return [
        expression.eArray([
          innerExpressionFromAst(ast.key, context)[0],
          innerExpressionFromAst(ast.value, context)[0],
        ]),
        context,
      ];
    case "Ternary":
      return [
        expression.eTernary(
          innerExpressionFromAst(ast.condition, context)[0],
          innerExpressionFromAst(ast.trueExpression, context)[0],
          innerExpressionFromAst(ast.falseExpression, context)[0]
        ),
        context,
      ];
    case "Array":
      return [
        expression.eArray(
          ast.elements.map(
            (statement) => innerExpressionFromAst(statement, context)[0]
          )
        ),
        context,
      ];
    case "Record":
      return [
        expression.eRecord(
          ast.elements.map((kv) => [
            innerExpressionFromAst(kv.key, context)[0],
            innerExpressionFromAst(kv.value, context)[0],
          ])
        ),
        context,
      ];
    case "Boolean":
      return [expression.eValue(vBool(ast.value)), context];
    case "Float":
      return [expression.eValue(vNumber(ast.value)), context];
    case "Integer":
      return [expression.eValue(vNumber(ast.value)), context];
    case "String":
      return [expression.eValue(vString(ast.value)), context];
    case "Void":
      return [expression.eVoid(), context];
    case "Identifier": {
      const offset = context.nameToPos.get(ast.value);
      if (offset === undefined) {
        return [getValueOrThrow(context, ast.value), context];
      } else {
        const result = expression.eResolvedSymbol(
          ast.value,
          context.size - 1 - offset
        );
        return [result, context];
      }
    }
    default:
      throw new Error(`Unsupported AST value ${ast satisfies never}`);
  }
}

function innerExpressionFromAst(
  ast: ASTNode,
  context: CompileContext
): [expression.Expression, CompileContext] {
  const [content, newContext] = contentFromNode(ast, context);
  return [
    {
      ast,
      ...content,
    },
    newContext,
  ];
}

export function expressionFromAst(
  ast: ASTNode,
  externals: Bindings
): expression.Expression {
  const [expression] = innerExpressionFromAst(
    ast,
    createInitialCompileContext(externals)
  );
  return expression;
}
