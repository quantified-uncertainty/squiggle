import {
  AnyExpressionNode,
  AnyStatementNode,
  KindTypedNode,
  TypedAST,
} from "../analysis/types.js";
import { infixFunctions, unaryFunctions } from "../ast/operators.js";
import { LocationRange } from "../ast/types.js";
import { ICompileError } from "../errors/IError.js";
import { Bindings } from "../reducer/Stack.js";
import * as Result from "../utility/result.js";
import { vBool } from "../value/VBool.js";
import { vNumber } from "../value/VNumber.js";
import { vString } from "../value/VString.js";
import { INDEX_LOOKUP_FUNCTION } from "./constants.js";
import * as ir from "./types.js";

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
      captures: ir.Ref[];
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
  scopes: Scope[] = [];

  // Externals will include:
  // 1. stdLib symbols
  // 2. imports
  // Externals will be inlined in the resulting IR.
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
    location: LocationRange,
    name: string,
    fromDepth: number
  ): ir.IRByKind<"StackRef" | "CaptureRef" | "Value"> {
    let offset = 0;

    // Unwind the scopes upwards.
    for (let i = fromDepth; i >= 0; i--) {
      const scope = this.scopes[i];
      if (name in scope.stack) {
        return {
          location,
          ...ir.make("StackRef", offset + scope.size - 1 - scope.stack[name]),
        };
      }
      offset += scope.size;

      if (scope.type === "function") {
        // Have we already captured this name?
        if (name in scope.captureIndex) {
          return {
            location,
            ...ir.make("CaptureRef", scope.captureIndex[name]),
          };
        }

        // This is either an external or a capture. Let's look for the
        // reference in the outer scopes, and then convert it to a capture if
        // necessary.
        const resolved = this.resolveNameFromDepth(location, name, i - 1);

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
          location,
          ...ir.make("CaptureRef", newIndex),
        };
      }
    }

    // `name` not found in scopes. So it must come from externals.
    const value = this.externals.get(name);
    if (value !== undefined) {
      return {
        location,
        ...ir.make("Value", value),
      };
    }

    throw new ICompileError(`${name} is not defined`, location);
  }

  resolveName(
    location: LocationRange,
    name: string
  ): ir.IRByKind<"StackRef" | "CaptureRef" | "Value"> {
    return this.resolveNameFromDepth(location, name, this.scopes.length - 1);
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

function compileExpressionContent(
  ast: AnyExpressionNode,
  context: CompileContext
): ir.AnyExpressionIRContent {
  switch (ast.kind) {
    case "Block": {
      if (ast.statements.length === 0) {
        // unwrap blocks; no need for extra scopes or Block IR nodes.
        return compileExpression(ast.result, context);
      }
      context.startScope();
      const statements: ir.StatementIR[] = [];
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
      return ir.make("Block", { statements, result });
    }
    case "Call": {
      return ir.eCall(
        compileExpression(ast.fn, context),
        ast.args.map((arg) => compileExpression(arg, context))
      );
    }
    case "InfixCall": {
      return ir.eCall(
        context.resolveName(ast.location, infixFunctions[ast.op]),
        ast.args.map((arg) => compileExpression(arg, context))
      );
    }
    case "UnaryCall":
      return ir.eCall(
        context.resolveName(ast.location, unaryFunctions[ast.op]),
        [compileExpression(ast.arg, context)]
      );
    case "Pipe":
      return ir.eCall(compileExpression(ast.fn, context), [
        compileExpression(ast.leftArg, context),
        ...ast.rightArgs.map((arg) => compileExpression(arg, context)),
      ]);
    case "DotLookup":
      return ir.eCall(
        context.resolveName(ast.location, INDEX_LOOKUP_FUNCTION),
        [
          compileExpression(ast.arg, context),
          {
            location: ast.location,
            ...ir.make("Value", vString(ast.key)),
          },
        ]
      );
    case "BracketLookup":
      return ir.eCall(
        context.resolveName(ast.location, INDEX_LOOKUP_FUNCTION),
        [
          compileExpression(ast.arg, context),
          compileExpression(ast.key, context),
        ]
      );
    case "Lambda": {
      const parameters: ir.LambdaIRParameter[] = [];
      for (const astParameter of ast.args) {
        parameters.push({
          name: astParameter.variable,
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
      return ir.make("Lambda", {
        name: ast.name ?? undefined,
        captures,
        parameters,
        body,
      });
    }
    case "Ternary":
      return ir.make("Ternary", {
        condition: compileExpression(ast.condition, context),
        ifTrue: compileExpression(ast.trueExpression, context),
        ifFalse: compileExpression(ast.falseExpression, context),
      });
    case "Array":
      return ir.make(
        "Array",
        ast.elements.map((statement) => compileExpression(statement, context))
      );
    case "Dict":
      return ir.make(
        "Dict",
        ast.elements.map((kv) => {
          if (kv.kind === "KeyValue") {
            return [
              compileExpression(kv.key, context),
              compileExpression(kv.value, context),
            ] as [ir.AnyExpressionIR, ir.AnyExpressionIR];
          } else if (kv.kind === "Identifier") {
            // shorthand
            const key = {
              location: kv.location,
              ...ir.make("Value", vString(kv.value)),
            };
            const value = context.resolveName(kv.location, kv.value);
            return [key, value] as [ir.AnyExpressionIR, ir.AnyExpressionIR];
          } else {
            throw new Error(
              `Internal AST error: unexpected kv ${kv satisfies never}`
            );
          }
        })
      );
    case "Boolean":
      return ir.make("Value", vBool(ast.value));
    case "Float": {
      const value = parseFloat(
        `${ast.integer}${ast.fractional === null ? "" : `.${ast.fractional}`}${
          ast.exponent === null ? "" : `e${ast.exponent}`
        }`
      );
      if (Number.isNaN(value)) {
        throw new ICompileError("Failed to compile a number", ast.location);
      }
      return ir.make("Value", vNumber(value));
    }
    case "String":
      return ir.make("Value", vString(ast.value));
    case "Identifier": {
      return context.resolveName(ast.location, ast.value);
    }
    case "UnitValue": {
      const fromUnitFn = context.resolveName(
        ast.location,
        `fromUnit_${ast.unit}`
      );
      return ir.eCall(fromUnitFn, [compileExpression(ast.value, context)]);
    }
    default: {
      const badAst = ast satisfies never;
      throw new Error(`Unsupported AST value ${JSON.stringify(badAst)}`);
    }
  }
}

function compileExpression(
  ast: AnyExpressionNode,
  context: CompileContext
): ir.AnyExpressionIR {
  const content = compileExpressionContent(ast, context);
  return {
    ...content,
    location: ast.location,
  };
}

function compileStatement(
  ast: AnyStatementNode,
  context: CompileContext
): ir.StatementIR {
  switch (ast.kind) {
    case "DefunStatement":
    case "LetStatement": {
      const name = ast.variable.value;
      let value = compileExpression(ast.value, context);

      for (const decorator of [...ast.decorators].reverse()) {
        const decoratorFn = context.resolveName(
          ast.location,
          `Tag.${decorator.name.value}`
        );
        value = {
          ...ir.eCall(
            decoratorFn,
            [
              value,
              ...decorator.args.map((arg) => compileExpression(arg, context)),
            ],
            "decorate"
          ),
          location: ast.location,
        };
      }

      context.defineLocal(name);
      return {
        ...ir.make("Assign", { left: name, right: value }),
        location: ast.location,
      };
    }
    default: {
      const badAst = ast satisfies never;
      throw new Error(`Unsupported AST value ${JSON.stringify(badAst)}`);
    }
  }
}

function compileProgram(
  ast: KindTypedNode<"Program">,
  context: CompileContext
): ir.ProgramIR {
  // No need to start a top-level scope, it already exists.
  const statements: ir.StatementIR[] = [];
  const exports: string[] = [];
  for (const astStatement of ast.statements) {
    const statement = compileStatement(astStatement, context);
    statements.push(statement);
    if (astStatement.exported) {
      const name = astStatement.variable.value;
      exports.push(name);
    }
  }
  const result = ast.result
    ? compileExpression(ast.result, context)
    : undefined;

  return {
    ...ir.make("Program", {
      statements,
      result,
      exports,
      bindings: context.localsOffsets(),
    }),
    location: ast.location,
  };
}

export function compileAst(
  ast: TypedAST,
  externals: Bindings
): Result.result<ir.ProgramIR, ICompileError> {
  try {
    const ir = compileProgram(ast, new CompileContext(externals));
    return Result.Ok(ir);
  } catch (err) {
    if (err instanceof ICompileError) {
      return Result.Err(err);
    }
    throw err; // internal error, better to detect early (but maybe we should wrap this in IOtherError instead)
  }
}
