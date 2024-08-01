import { REAmbiguous } from "../../errors/messages.js";
import { Reducer } from "../../reducer/Reducer.js";
import { Value } from "../../value/index.js";
import { fnInput, FnInput } from "./fnInput.js";
import { frAny, FRType } from "./frTypes.js";

// Type safety of `FnDefinition is guaranteed by `makeDefinition` signature below and by `FRType` unpack logic.
// It won't be possible to make `FnDefinition` generic without sacrificing type safety in other parts of the codebase,
// because of contravariance (we need to store all FnDefinitions in a generic array later on).
export type FnDefinition<OutputType = any> = {
  inputs: FnInput<any>[];
  run: (args: any[], reducer: Reducer) => OutputType;
  output: FRType<OutputType>;
  minInputs: number;
  maxInputs: number;
  isAssert: boolean;
  // We don't use the string value right now, but could later on.
  deprecated?: string;
  // If set, the function can be used as a decorator.
  // Note that the name will always be prepended with `Tag.`, so it makes sense only on function in `Tag` namespace.
  isDecorator?: boolean;
};

export type InputOrType<T> = FnInput<T> | FRType<T>;

export function inputOrTypeToInput<T>(input: InputOrType<T>): FnInput<T> {
  return input instanceof FnInput ? input : fnInput({ type: input });
}

export const showInDocumentation = (def: FnDefinition) =>
  !def.isAssert && !def.deprecated;

// A function to make sure that there are no non-optional inputs after optional inputs:
function assertOptionalsAreAtEnd(inputs: FnInput<any>[]) {
  let optionalFound = false;
  for (const input of inputs) {
    if (optionalFound && !input.optional) {
      throw new Error(
        `Optional inputs must be last. Found non-optional input after optional input. ${inputs}`
      );
    }
    if (input.optional) {
      optionalFound = true;
    }
  }
}

export function makeDefinition<
  const InputTypes extends any[],
  const OutputType,
>(
  // [...] wrapper is important, see also: https://stackoverflow.com/a/63891197
  maybeInputs: [...{ [K in keyof InputTypes]: InputOrType<InputTypes[K]> }],
  output: FRType<OutputType>,
  run: (args: InputTypes, reducer: Reducer) => OutputType,
  params?: { deprecated?: string; isDecorator?: boolean }
): FnDefinition {
  const inputs = maybeInputs.map(inputOrTypeToInput);

  assertOptionalsAreAtEnd(inputs);
  return {
    inputs,
    output,
    // Type of `run` argument must match `FnDefinition['run']`. This
    // This unsafe type casting is necessary because function type parameters are contravariant.
    run: run as FnDefinition["run"],
    isAssert: false,
    deprecated: params?.deprecated,
    isDecorator: params?.isDecorator,
    minInputs: inputs.filter((t) => !t.optional).length,
    maxInputs: inputs.length,
  };
}

//Some definitions are just used to guard against ambiguous function calls, and should never be called.
export function makeAssertDefinition<const T extends any[]>(
  // [...] wrapper is important, see also: https://stackoverflow.com/a/63891197
  maybeInputs: [...{ [K in keyof T]: InputOrType<T[K]> }],
  errorMsg: string
): FnDefinition {
  const inputs = maybeInputs.map(inputOrTypeToInput);

  assertOptionalsAreAtEnd(inputs);
  return {
    inputs,
    output: frAny(),
    run: () => {
      throw new REAmbiguous(errorMsg);
    },
    isAssert: true,
    minInputs: inputs.filter((t) => !t.optional).length,
    maxInputs: inputs.length,
  };
}

export function tryCallFnDefinition(
  fn: FnDefinition,
  args: Value[],
  reducer: Reducer
): Value | undefined {
  if (args.length < fn.minInputs || args.length > fn.maxInputs) {
    return; // args length mismatch
  }
  const unpackedArgs: any = []; // any, but that's ok, type safety is guaranteed by FnDefinition type
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    const unpackedArg = fn.inputs[i].type.unpack(arg);
    if (unpackedArg === undefined) {
      // type mismatch
      return;
    }
    unpackedArgs.push(unpackedArg);
  }

  // Fill in missing optional arguments with nulls.
  // This is important, because empty optionals should be nulls, but without this they would be undefined.
  if (unpackedArgs.length < fn.maxInputs) {
    unpackedArgs.push(...Array(fn.maxInputs - unpackedArgs.length).fill(null));
  }

  return fn.output.pack(fn.run(unpackedArgs, reducer));
}

export function fnDefinitionToString(fn: FnDefinition): string {
  const inputs = fn.inputs.map((t) => t.toString()).join(", ");
  const output = fn.output.display();
  return `(${inputs})${output ? ` => ${output}` : ""}`;
}
