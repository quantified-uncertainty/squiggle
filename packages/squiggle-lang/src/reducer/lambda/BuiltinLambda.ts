import uniq from "lodash/uniq.js";

import { REOther } from "../../errors/messages.js";
import { FnDefinition } from "../../library/registry/fnDefinition.js";
import { FnInput } from "../../library/registry/fnInput.js";
import { Type } from "../../types/Type.js";
import { sort } from "../../utility/E_A_Floats.js";
import { Value } from "../../value/index.js";
import { Reducer } from "../Reducer.js";
import { BaseLambda } from "./index.js";

// Stdlib functions (everything defined in function registry, `src/fr/*`) are instances of this class.

export class BuiltinLambda extends BaseLambda {
  readonly type = "BuiltinLambda";
  private definitions: FnDefinition[];

  constructor(
    public name: string,
    signatures: FnDefinition[]
  ) {
    super();
    this.definitions = signatures;

    // TODO - this sets the flag that the function is a decorator, but later we don't check which signatures are decorators.
    // For now, it doesn't matter because we don't allow user-defined decorators, and `Tag.*` decorators work as decorators on all possible definitions.
    this.isDecorator = signatures.some((s) => s.isDecorator);
  }

  display() {
    return this.name;
  }

  toString() {
    return this.name;
  }

  parameterString() {
    return this.definitions
      .filter((d) => d.showInDocumentation())
      .map((d) => d.toString())
      .join(" | ");
  }

  parameterCounts() {
    return sort(uniq(this.definitions.map((d) => d.inputs.length)));
  }

  parameterCountString() {
    return `[${this.parameterCounts().join(",")}]`;
  }

  signatures(): FnInput<Type<unknown>>[][] {
    return this.definitions.map((d) => d.inputs);
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
