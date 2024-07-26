import { LocationRange } from "../ast/types.js";
import { ICompileError } from "../errors/IError.js";
import { Bindings } from "../reducer/Stack.js";
import { IRByKind, make, Ref } from "./types.js";

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
      captures: Ref[];
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
export class CompileContext {
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
  ): IRByKind<"StackRef" | "CaptureRef" | "Value"> {
    let offset = 0;

    // Unwind the scopes upwards.
    for (let i = fromDepth; i >= 0; i--) {
      const scope = this.scopes[i];
      if (name in scope.stack) {
        return {
          location,
          ...make("StackRef", offset + scope.size - 1 - scope.stack[name]),
        };
      }
      offset += scope.size;

      if (scope.type === "function") {
        // Have we already captured this name?
        if (name in scope.captureIndex) {
          return {
            location,
            ...make("CaptureRef", scope.captureIndex[name]),
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
          ...make("CaptureRef", newIndex),
        };
      }
    }

    // `name` not found in scopes. So it must come from externals.
    const value = this.externals.get(name);
    if (value !== undefined) {
      return {
        location,
        ...make("Value", value),
      };
    }

    throw new ICompileError(`${name} is not defined`, location);
  }

  resolveName(
    location: LocationRange,
    name: string
  ): IRByKind<"StackRef" | "CaptureRef" | "Value"> {
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
