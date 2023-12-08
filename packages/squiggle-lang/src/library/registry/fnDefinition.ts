import { REAmbiguous } from "../../errors/messages.js";
import { ReducerContext } from "../../reducer/context.js";
import { VBoxed, Value } from "../../value/index.js";
import { FRType, frAny } from "./frTypes.js";

// Type safety of `FnDefinition is guaranteed by `makeDefinition` signature below and by `FRType` unpack logic.
// It won't be possible to make `FnDefinition` generic without sacrificing type safety in other parts of the codebase,
// because of contravariance (we need to store all FnDefinitions in a generic array later on).
export type FnDefinition<OutputType = any> = {
  inputs: FRType<any>[];
  run: (args: any[], context: ReducerContext) => OutputType;
  output: FRType<OutputType>;
  isAssert: boolean;
};

export function makeDefinition<
  const InputTypes extends any[],
  const OutputType,
>(
  // [...] wrapper is important, see also: https://stackoverflow.com/a/63891197
  inputs: [...{ [K in keyof InputTypes]: FRType<InputTypes[K]> }],
  output: FRType<OutputType>,
  run: (args: InputTypes, context: ReducerContext) => OutputType
): FnDefinition {
  return {
    inputs,
    output,
    // Type of `run` argument must match `FnDefinition['run']`. This
    // This unsafe type casting is necessary because function type parameters are contravariant.
    run: run as FnDefinition["run"],
    isAssert: false,
  };
}

//Some definitions are just used to guard against ambiguous function calls, and should never be called.
export function makeAssertDefinition<const T extends any[]>(
  // [...] wrapper is important, see also: https://stackoverflow.com/a/63891197
  inputs: [...{ [K in keyof T]: FRType<T[K]> }],
  errorMsg: string
): FnDefinition {
  return {
    inputs,
    output: frAny,
    run: () => {
      throw new REAmbiguous(errorMsg);
    },
    isAssert: true,
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
    let arg = args[i];

    const { keepBoxes } = fn.inputs[i];
    const valueIsBoxed = arg.type === "Boxed" || false;

    if (valueIsBoxed && !keepBoxes) {
      arg = (arg as VBoxed).value.value;
    }

    const unpackedArg = fn.inputs[i].unpack(arg);
    if (unpackedArg === undefined) {
      // type mismatch
      return;
    }
    unpackedArgs.push(unpackedArg);
  }
  return fn.output.pack(fn.run(unpackedArgs, context));
}

export function fnDefinitionToString(fn: FnDefinition): string {
  const inputs = fn.inputs.map((t) => t.getName()).join(", ");
  const output = fn.output.getName();
  return `(${inputs})${output ? ` => ${output}` : ""}`;
  return `(${inputs}) => ${output}`;
}
