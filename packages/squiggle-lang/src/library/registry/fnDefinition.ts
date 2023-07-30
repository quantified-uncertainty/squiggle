import { ReducerContext } from "../../reducer/context.js";
import { Value } from "../../value/index.js";
import { FRType } from "./frTypes.js";

// Type safety of `FnDefinition is guaranteed by `makeDefinition` signature below and by `FRType` unpack logic.
// It won't be possible to make `FnDefinition` generic without sacrificing type safety in other parts of the codebase,
// because of contravariance (we need to store all FnDefinitions in a generic array later on).
export type FnDefinition = {
  inputs: FRType<any>[];
  run: (args: any[], context: ReducerContext) => Value;
};

export function makeDefinition<const T extends any[]>(
  // [...] wrapper is important, see also: https://stackoverflow.com/a/63891197
  inputs: [...{ [K in keyof T]: FRType<T[K]> }],
  run: (args: T, context: ReducerContext) => Value
): FnDefinition {
  return {
    inputs,
    // Type of `run` argument must match `FnDefinition['run']`. This
    // This unsafe type casting is necessary because function type parameters are contravariant.
    run: run as FnDefinition["run"],
  };
}

export function tryCallFnDefinition(
  fn: FnDefinition,
  args: Value[],
  context: ReducerContext
): Value | undefined {
  if (args.length !== fn.inputs.length) {
    return; // args length mismatch
  }
  const unpackedArgs: any = []; // any, but that's ok, type safety is guaranteed by FnDefinition type
  for (let i = 0; i < args.length; i++) {
    const unpackedArg = fn.inputs[i].unpack(args[i]);
    if (unpackedArg === undefined) {
      // type mismatch
      return;
    }
    unpackedArgs.push(unpackedArg);
  }
  return fn.run(unpackedArgs, context);
}

export function fnDefinitionToString(fn: FnDefinition): string {
  const inputs = fn.inputs.map((t) => t.getName()).join(", ");
  return `(${inputs})`;
}
