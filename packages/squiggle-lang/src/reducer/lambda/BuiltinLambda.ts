import { LocationRange } from "../../ast/types.js";
import { ErrorMessage } from "../../errors/messages.js";
import { TTypedLambda } from "../../types/TTypedLambda.js";
import { Value } from "../../value/index.js";
import { Frame } from "../FrameStack.js";
import { Reducer } from "../Reducer.js";
import { FnDefinition } from "./FnDefinition.js";
import { BaseLambda } from "./index.js";

/*
 * Stdlib functions (everything defined in function registry, `src/fr/*`) are
 * instances of this class.
 */
export class BuiltinLambda extends BaseLambda {
  readonly type = "BuiltinLambda";

  constructor(
    public name: string,
    public definitions: FnDefinition[]
  ) {
    super();

    /*
     * TODO - this sets the flag that the function is a decorator, but later we
     * don't check which signatures are decorators.
     *
     * For now, it doesn't matter because we don't allow user-defined
     * decorators, and `Tag.*` decorators work as decorators on all possible
     * definitions.
     */
    this.isDecorator = definitions.some((s) => s.isDecorator);
  }

  display() {
    return this.name;
  }

  toString() {
    return this.name;
  }

  override signatures(): TTypedLambda[] {
    return this.definitions.map((d) => d.signature);
  }

  parameterString() {
    return this.definitions
      .filter((d) => d.showInDocumentation())
      .map((d) => d.toString())
      .join(" | ");
  }

  call(args: Value[], reducer: Reducer, location?: LocationRange): Value {
    reducer.frameStack.extend(new Frame(this, location));

    for (const definition of this.definitions) {
      const callResult = definition.tryCall(args, reducer);
      if (callResult !== undefined) {
        // If lambda throws an exception, this won't happen.  This is intentional;
        // it allows us to build the correct stacktrace with `.errorFromException`
        // method later.
        reducer.frameStack.pop();
        return callResult;
      }
    }

    // None of the definitions matched the arguments.
    throw ErrorMessage.runtimeCallSignatureMismatchError(this, args);
  }
}
