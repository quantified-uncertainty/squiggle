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
import { Expression } from "./index.js";

type Scope = {
  // Position on stack is counted from the first element on stack, unlike in
  // StackRef's offset.  See switch branch for "Identifier" AST type below.
  stack: Record<string, number>;
  size: number;
} & (
  | {
      // It's possible to have multiple block scopes; example: `x = 5; { y = 6; z = 7; {{{ x + y + z }}} }`.
      type: "block";
    }
  | {
      type: "function";
      // Captures will be populated on the first attempt to resolve a name that should be captured.
      captures: expression.Ref[];
      captureIndex: Record<string, number>;
    }
);

/**
 * This class is mutable; its methods often have side effects, and the correct
 * state is guaranteed by the compilation loop.  For example, when the
 * compilation loop calls `startScope()`, it should later call `finishScope()`.
 * If you forget to do that, bad things will happen.
 *
 * Immutable context would be easier to code without bugs, and the performance
 * isn't a big issue here.  But the problem is that name lookups in closures are
 * actions-at-distance; we should register each lookup in captures, sometimes
 * for enclosing functions, which would be hard to implement with immutability.
 */
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
  ): expression.ExpressionByKind<"StackRef" | "CaptureRef" | "Value"> {
    let offset = 0;

    // Unwind the scopes upwards.
    for (let i = fromDepth; i >= 0; i--) {
      const scope = this.scopes[i];
      if (name in scope.stack) {
        return {
          ast,
          ...expression.make(
            "StackRef",
            offset + scope.size - 1 - scope.stack[name]
          ),
        };
      }
      offset += scope.size;

      if (scope.type === "function") {
        // Have we already captured this name?
        if (name in scope.captureIndex) {
          return {
            ast,
            ...expression.make("CaptureRef", scope.captureIndex[name]),
          };
        }

        // This is either an external or a capture. Let's look for the
        // reference in the outer scopes, and then convert it to a capture if
        // necessary.
        const resolved = this.resolveNameFromDepth(ast, name, i - 1);

        if (resolved.kind === "Value") {
          // Inlined, so it's probably an external. Nothing more to do.
          return resolved;
        }

        /**
         * `resolved` is a reference. From the outer scope POV, it could be:
         * 1. A stack reference: `x = 5; f() = x`.
         * 2. A reference to another capture: `x = 5; f() = { g() = x; g }`
         * In the latter case, `x` is a capture from stack for `f`, and a capture from `f`'s captures for `g`.
         *
         * Either way, we're going to convert it to a capture from the current function's POV.
         */
        const newIndex = scope.captures.length;
        const newCapture = resolved;
        scope.captures.push(newCapture);
        scope.captureIndex[name] = newIndex;
        return {
          ast,
          ...expression.make("CaptureRef", newIndex),
        };
      }
    }

    // `name` not found in scopes. So it must come from externals.
    const value = this.externals.get(name);
    if (value !== undefined) {
      return {
        ast,
        ...expression.make("Value", value),
      };
    }

    throw new ICompileError(`${name} is not defined`, ast.location);
  }

  resolveName(ast: ASTNode, name: string): Expression {
    return this.resolveNameFromDepth(ast, name, this.scopes.length - 1);
  }

  localsOffsets() {
    const currentScope = this.scopes.at(-1);
    if (!currentScope) {
      throw new Error("Compiler error, out of scopes");
    }
    const result: Record<string, number> = {};
    for (const [name, offset] of Object.entries(currentScope.stack)) {
      result[name] = currentScope.size - 1 - offset;
    }
    return result;
  }
}

function compileToContent(
  ast: ASTNode,
  context: CompileContext
): expression.ExpressionContent {
  switch (ast.type) {
    case "Block": {
      context.startScope();
      const statements: Expression[] = [];
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
      return expression.make("Block", statements);
    }
    case "Program": {
      // No need to start a top-level scope, it already exists.
      const statements: Expression[] = [];
      const exports: string[] = [];
      for (const astStatement of ast.statements) {
        const statement = innerCompileAst(astStatement, context);
        statements.push(statement);
        {
          const maybeExportedStatement = undecorated(astStatement);
          if (
            maybeExportedStatement.type === "LetStatement" ||
            maybeExportedStatement.type === "DefunStatement"
          ) {
            if (maybeExportedStatement.exported) {
              const name = maybeExportedStatement.variable.value;
              exports.push(name);
            }
          }
        }
      }
      return expression.make("Program", {
        statements,
        exports,
        bindings: context.localsOffsets(),
      });
    }
    case "DefunStatement":
    case "LetStatement": {
      const name = ast.variable.value;
      const value = innerCompileAst(ast.value, context);
      context.defineLocal(name);
      return expression.make("Assign", { left: name, right: value });
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
        { ast, ...expression.make("Value", vString(ast.key)) },
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
      return expression.make("Lambda", {
        name: ast.name,
        captures,
        parameters: args,
        body,
      });
    }
    case "KeyValue":
      return expression.make("Array", [
        innerCompileAst(ast.key, context),
        innerCompileAst(ast.value, context),
      ]);
    case "Ternary":
      return expression.make("Ternary", {
        condition: innerCompileAst(ast.condition, context),
        ifTrue: innerCompileAst(ast.trueExpression, context),
        ifFalse: innerCompileAst(ast.falseExpression, context),
      });
    case "Array":
      return expression.make(
        "Array",
        ast.elements.map((statement) => innerCompileAst(statement, context))
      );
    case "Dict":
      return expression.make(
        "Dict",
        ast.elements.map((kv) => {
          if (kv.type === "KeyValue") {
            return [
              innerCompileAst(kv.key, context),
              innerCompileAst(kv.value, context),
            ] as [Expression, Expression];
          } else if (kv.type === "Identifier") {
            // shorthand
            const key = {
              ast: kv,
              ...expression.make("Value", vString(kv.value)),
            };
            const value = context.resolveName(kv, kv.value);
            return [key, value] as [Expression, Expression];
          } else {
            throw new Error(
              `Internal AST error: unexpected kv ${kv satisfies never}`
            ); // parsed to incorrect AST, shouldn't happen
          }
        })
      );
    case "Boolean":
      return expression.make("Value", vBool(ast.value));
    case "Float": {
      const value = parseFloat(
        `${ast.integer}${ast.fractional === null ? "" : `.${ast.fractional}`}${
          ast.exponent === null ? "" : `e${ast.exponent}`
        }`
      );
      if (Number.isNaN(value)) {
        throw new ICompileError("Failed to compile a number", ast.location);
      }
      return expression.make("Value", vNumber(value));
    }
    case "String":
      return expression.make("Value", vString(ast.value));
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
