import { NodeIdentifier } from "../analysis/NodeIdentifier.js";
import { NodeIdentifierDefinition } from "../analysis/NodeIdentifierDefinition.js";
import { LocationRange } from "../ast/types.js";
import { ICompileError } from "../errors/IError.js";
import { Bindings } from "../reducer/Stack.js";
import { Value } from "../value/index.js";
import { IRByKind, make, Ref } from "./types.js";

/*
 * During the compilation stage, identifers are already resolved to their
 * definitions (AST nodes that define the identifier).
 *
 * So, for the sake of consistency and simplicity, we don't store name ->
 * definition mappings here. Instead, we store definition nodes themselves, and
 * we resolve them to their positions in the stack or captures.
 */
type Scope = {
  /*
   * Position on stack is counted from the first element on stack, unlike in
   * StackRef's offset. See the branch for "Identifier" AST type in
   * `compileExpressionContent`.
   */
  stack: Map<NodeIdentifierDefinition, number>;
} & (
  | {
      // It's possible to have multiple block scopes; example: `x = 5; { y = 6; z = 7; {{{ x + y + z }}} }`.
      type: "block";
    }
  | {
      type: "function";
      // Captures will be populated on the first attempt to resolve a name that should be captured.
      captures: Ref[];
      captureIndex: Map<NodeIdentifierDefinition, number>;
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
export class CompileContext {
  scopes: Scope[] = [];

  // Stdlib values will be inlined in the resulting IR.
  constructor(
    public stdlib: Bindings,
    public imports: Record<string, Value>
  ) {
    // top-level scope
    this.startScope();
  }

  startScope() {
    this.scopes.push({
      type: "block",
      stack: new Map(),
    });
  }

  finishScope() {
    this.scopes.pop();
  }

  startFunctionScope() {
    this.scopes.push({
      type: "function",
      stack: new Map(),
      captures: [],
      captureIndex: new Map(),
    });
  }

  currentScopeCaptures() {
    const currentScope = this.scopes.at(-1);
    if (currentScope?.type !== "function") {
      throw new Error("Compiler error, expected a function scope");
    }
    return currentScope.captures;
  }

  defineLocal(name: NodeIdentifierDefinition) {
    const currentScope = this.scopes.at(-1);
    if (!currentScope) {
      throw new Error("Compiler error, out of scopes");
    }
    currentScope.stack.set(name, currentScope.stack.size);
  }

  private resolveNameFromDepth(
    location: LocationRange, // location of the Identifier node
    name: NodeIdentifierDefinition, // definition to which the Identifier node was resolved by the analysis stage
    fromDepth: number
  ): IRByKind<"StackRef" | "CaptureRef" | "Value"> {
    let offset = 0;

    // Unwind the scopes upwards.
    for (let i = fromDepth; i >= 0; i--) {
      const scope = this.scopes[i];

      const position = scope.stack.get(name);
      if (position !== undefined) {
        return {
          location,
          ...make("StackRef", offset + scope.stack.size - 1 - position),
        };
      }
      offset += scope.stack.size;

      if (scope.type === "function") {
        // Have we already captured this name?
        {
          const position = scope.captureIndex.get(name);
          if (position !== undefined) {
            return {
              location,
              ...make("CaptureRef", position),
            };
          }
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
        scope.captureIndex.set(name, newIndex);
        return {
          location,
          ...make("CaptureRef", newIndex),
        };
      }
    }

    // This shouldn't happen - if the analysis stage says that the identifier is
    // resolved to its definition, it should be in the stack.
    throw new ICompileError(
      `Internal compiler error: ${name.value} definition not found in compiler context`,
      location
    );
  }

  resolveIdentifier(
    identifier: NodeIdentifier
  ): IRByKind<"StackRef" | "CaptureRef" | "Value"> {
    if (identifier.resolved.kind === "builtin") {
      return {
        location: identifier.location,
        ...make("Value", identifier.resolved.value),
      };
    }

    return this.resolveNameFromDepth(
      identifier.location,
      identifier.resolved.node,
      this.scopes.length - 1
    );
  }

  resolveBuiltin(location: LocationRange, name: string): IRByKind<"Value"> {
    const value = this.stdlib.get(name);
    if (value === undefined) {
      throw new ICompileError(`${name} is not defined`, location);
    }
    return {
      location,
      ...make("Value", value),
    };
  }
}
