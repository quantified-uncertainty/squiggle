import { REOther } from "../../errors/messages.js";
import { TTypedLambda } from "../../types/TTypedLambda.js";
import { Value } from "../../value/index.js";
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
    private definitions: FnDefinition[]
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

  callBody(args: Value[], reducer: Reducer): Value {
    for (const definition of this.definitions) {
      const callResult = definition.tryCall(args, reducer);
      if (callResult !== undefined) {
        return callResult;
      }
    }

    // None of the definitions matched the arguments.

    const defsString = this.definitions
      .filter((d) => d.showInDocumentation())
      .map((def) => `  ${this.name}${def}\n`)
      .join("");

    const message = `There are function matches for ${this.name}(), but with different arguments:\n${defsString}Was given arguments: (${args.join(
      ","
    )})`;

    throw new REOther(message);
  }
}
