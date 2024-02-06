import { ASTNode } from "../ast/parse.js";
import { infixFunctions, unaryFunctions } from "../ast/peggyHelpers.js";
import { undecorated } from "../ast/utils.js";
import { ICompileError } from "../errors/IError.js";
import { Bindings } from "../reducer/stack.js";
import * as Result from "../utility/result.js";
import { vBool } from "../value/VBool.js";
import { vNumber } from "../value/VNumber.js";
import { vString } from "../value/VString.js";
import { INDEX_LOOKUP_FUNCTION } from "./constants.js";
import * as expression from "./index.js";

type Scope = {
  // Position on stack is counted from the first element on stack, unlike in StackRef's offset.
  // See switch branch for "Identifier" AST type below.
  stack: Record<string, number>;
  size: number;
} & (
  | {
      type: "block";
    }
  | {
      type: "function";
      // Captures will be populated on the first attempt to resolve a name that should be captured.
      captures: expression.Ref[];
      captureIndex: Record<string, number>;
    }
);

class CompileContext {
  // Externals will include:
  // 1. stdLib symbols
  // 2. "continues"
  // 3. imports
  // Externals will be inlined in the resulting expression.
  scopes: Scope[] = [];

  constructor(public externals: Bindings) {
    // top-level scope
    this.startScope();
  }

  startScope() {
    this.scopes.push({
      type: "block",
      stack: {},
      size: 0,
    });
  }

  finishScope() {
    this.scopes.pop();
  }

  startFunctionScope() {
    this.scopes.push({
      type: "function",
      stack: {},
      size: 0,
      captures: [],
      captureIndex: {},
    });
  }

  currentScopeCaptures() {
    const currentScope = this.scopes.at(-1);
    if (currentScope?.type !== "function") {
      throw new Error("Compiler error, expected a function scope");
    }
    return currentScope.captures;
  }

  defineLocal(name: string) {
    const currentScope = this.scopes.at(-1);
    if (!currentScope) {
      throw new Error("Compiler error, out of scopes");
    }
    currentScope.stack[name] = currentScope.size;
    currentScope.size++;
  }

  private resolveNameFromDepth(
    ast: ASTNode,
    name: string,
    fromDepth: number
  ): expression.TypedExpression<"StackRef" | "CaptureRef" | "Value"> {
    let offset = 0;
    for (let i = fromDepth; i >= 0; i--) {
      const scope = this.scopes[i];
      if (name in scope.stack) {
        return {
          ast,
          ...expression.eStackRef(
            name,
            offset + scope.size - 1 - scope.stack[name]
          ),
        };
      }
      offset += scope.size;
      if (scope.type === "function") {
        if (name in scope.captureIndex) {
          return {
            ast,
            ...scope.captures[scope.captureIndex[name]],
          };
        }

        // So this is either an external or a capture.
        const resolved = this.resolveNameFromDepth(ast, name, i - 1);
        if (resolved.type === "Value") {
          return resolved;
        }
        const newIndex = scope.captures.length;
        const newCapture = resolved;
        scope.captures.push(newCapture);
        scope.captureIndex[name] = newIndex;
        return {
          ast,
          ...expression.eCaptureRef(name, newIndex),
        };
      }
    }

    const value = this.externals.get(name);
    if (value !== undefined) {
      return {
        ast,
        ...expression.eValue(value),
      };
    }

    throw new ICompileError(`${name} is not defined`, ast.location);
  }

  resolveName(ast: ASTNode, name: string): expression.Expression {
    return this.resolveNameFromDepth(ast, name, this.scopes.length - 1);
  }
}

function compileToContent(
  ast: ASTNode,
  context: CompileContext
): expression.ExpressionContent {
  switch (ast.type) {
    case "Block": {
      context.startScope();
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
        const statement = innerCompileAst(astStatement, context);
        statements.push(statement);
      }
      context.finishScope();
      return expression.eBlock(statements);
    }
    case "Program": {
      // no need to start a top-level scope, it already exists
      const statements: expression.Expression[] = [];
      const exports: string[] = [];
      for (const astStatement of ast.statements) {
        const statement = innerCompileAst(astStatement, context);
        statements.push(statement);
        {
          const maybeExportedStatement = undecorated(astStatement);
          if (
            (maybeExportedStatement.type === "LetStatement" ||
              maybeExportedStatement.type === "DefunStatement") &&
            maybeExportedStatement.exported
          ) {
            exports.push(maybeExportedStatement.variable.value);
          }
        }
      }
      return expression.eProgram(statements, exports);
    }
    case "DefunStatement":
    case "LetStatement": {
      const name = ast.variable.value;
      const value = innerCompileAst(ast.value, context);
      context.defineLocal(name);
      return expression.eLetStatement(name, value);
    }
    case "DecoratedStatement": {
      // First, compile the inner statement.
      // FIXME - `context` will include the new binding after this call!
      const innerExpression = innerCompileAst(ast.statement, context);

      throw new Error("TODO - implement decorators");

      // if (innerExpression.type !== "Assign") {
      //   // Shouldn't happen, `ast.statement` is always compiled to `Assign`
      //   throw new ICompileError(
      //     "Can't apply a decorator to non-Assign expression",
      //     ast.location
      //   );
      // }
      // // Then wrap it in a function call.
      // const decoratorFn = resolveName(
      //   context,
      //   ast,
      //   `Tag.${ast.decorator.name.value}`
      // );
      // return [
      //   expression.eLetStatement(innerExpression.value.left, {
      //     ast: ast.statement,
      //     ...expression.eCall(
      //       decoratorFn,
      //       [
      //         innerExpression.value.right,
      //         ...ast.decorator.args.map(
      //           (arg) => innerCompileAst(arg, context)[0]
      //         ),
      //       ],
      //       "decorate"
      //     ),
      //   }),
      //   newContext,
      // ];
    }
    case "Decorator":
      throw new ICompileError("Can't compile Decorator node", ast.location);
    case "Call": {
      return expression.eCall(
        innerCompileAst(ast.fn, context),
        ast.args.map((arg) => innerCompileAst(arg, context))
      );
    }
    case "InfixCall": {
      return expression.eCall(
        context.resolveName(ast, infixFunctions[ast.op]),
        ast.args.map((arg) => innerCompileAst(arg, context))
      );
    }
    case "UnaryCall":
      return expression.eCall(
        context.resolveName(ast, unaryFunctions[ast.op]),
        [innerCompileAst(ast.arg, context)]
      );
    case "Pipe":
      return expression.eCall(innerCompileAst(ast.fn, context), [
        innerCompileAst(ast.leftArg, context),
        ...ast.rightArgs.map((arg) => innerCompileAst(arg, context)),
      ]);
    case "DotLookup":
      return expression.eCall(context.resolveName(ast, INDEX_LOOKUP_FUNCTION), [
        innerCompileAst(ast.arg, context),
        { ast, ...expression.eValue(vString(ast.key)) },
      ]);
    case "BracketLookup":
      return expression.eCall(context.resolveName(ast, INDEX_LOOKUP_FUNCTION), [
        innerCompileAst(ast.arg, context),
        innerCompileAst(ast.key, context),
      ]);
    case "Lambda": {
      context.startFunctionScope();
      const args: expression.LambdaExpressionParameter[] = [];
      for (let i = 0; i < ast.args.length; i++) {
        const astArg = ast.args[i];

        let arg: expression.LambdaExpressionParameter;
        if (astArg.type === "Identifier") {
          arg = { name: astArg.value, annotation: undefined };
        } else if (astArg.type === "IdentifierWithAnnotation") {
          arg = {
            name: astArg.variable,
            annotation: innerCompileAst(astArg.annotation, context),
          };
        } else {
          // should never happen
          throw new ICompileError(
            `Internal error: argument ${astArg.type} is not an identifier`,
            ast.location
          );
        }
        args.push(arg);
        context.defineLocal(arg.name);
      }
      const body = innerCompileAst(ast.body, context);
      const captures = context.currentScopeCaptures();
      context.finishScope();
      return expression.eLambda(ast.name, captures, args, body);
    }
    case "KeyValue":
      return expression.eArray([
        innerCompileAst(ast.key, context),
        innerCompileAst(ast.value, context),
      ]);
    case "Ternary":
      return expression.eTernary(
        innerCompileAst(ast.condition, context),
        innerCompileAst(ast.trueExpression, context),
        innerCompileAst(ast.falseExpression, context)
      );
    case "Array":
      return expression.eArray(
        ast.elements.map((statement) => innerCompileAst(statement, context))
      );
    case "Dict":
      return expression.eDict(
        ast.elements.map((kv) => {
          if (kv.type === "KeyValue") {
            return [
              innerCompileAst(kv.key, context),
              innerCompileAst(kv.value, context),
            ];
          } else if (kv.type === "Identifier") {
            // shorthand
            const key = { ast: kv, ...expression.eValue(vString(kv.value)) };
            const value = context.resolveName(kv, kv.value);
            return [key, value];
          } else {
            throw new Error(
              `Internal AST error: unexpected kv ${kv satisfies never}`
            ); // parsed to incorrect AST, shouldn't happen
          }
        })
      );
    case "Boolean":
      return expression.eValue(vBool(ast.value));
    case "Float": {
      const value = parseFloat(
        `${ast.integer}${ast.fractional === null ? "" : `.${ast.fractional}`}${
          ast.exponent === null ? "" : `e${ast.exponent}`
        }`
      );
      if (Number.isNaN(value)) {
        throw new ICompileError("Failed to compile a number", ast.location);
      }
      return expression.eValue(vNumber(value));
    }
    case "String":
      return expression.eValue(vString(ast.value));
    case "Identifier": {
      return context.resolveName(ast, ast.value);
    }
    case "UnitValue": {
      const fromUnitFn = context.resolveName(ast, `fromUnit_${ast.unit}`);
      return expression.eCall(fromUnitFn, [
        innerCompileAst(ast.value, context),
      ]);
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
): expression.Expression {
  const content = compileToContent(ast, context);
  return {
    ast,
    ...content,
  };
}

export function compileAst(
  ast: ASTNode,
  externals: Bindings
): Result.result<expression.Expression, ICompileError> {
  try {
    const expression = innerCompileAst(ast, new CompileContext(externals));
    return Result.Ok(expression);
  } catch (err) {
    if (err instanceof ICompileError) {
      return Result.Err(err);
    }
    throw err; // internal error, better to detect early (but maybe we should wrap this in IOtherError instead)
  }
}
