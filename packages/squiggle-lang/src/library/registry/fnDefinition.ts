import { REAmbiguous } from "../../errors/messages.js";
import { Interpreter } from "../../reducer/Interpreter.js";
import { Value } from "../../value/index.js";
import { frAny, FRType, isOptional } from "./frTypes.js";

// Type safety of `FnDefinition is guaranteed by `makeDefinition` signature below and by `FRType` unpack logic.
// It won't be possible to make `FnDefinition` generic without sacrificing type safety in other parts of the codebase,
// because of contravariance (we need to store all FnDefinitions in a generic array later on).
export type FnDefinition<OutputType = any> = {
  inputs: FRType<any>[];
  run: (args: any[], context: Interpreter) => OutputType;
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

export const showInDocumentation = (def: FnDefinition) =>
  !def.isAssert && !def.deprecated;

// A function to make sure that there are no non-optional inputs after optional inputs:
function assertOptionalsAreAtEnd(inputs: FRType<any>[]) {
  let optionalFound = false;
  for (const input of inputs) {
    if (optionalFound && !isOptional(input)) {
      throw new Error(
        `Optional inputs must be last. Found non-optional input after optional input. ${inputs}`
      );
    }
    if (isOptional(input)) {
      optionalFound = true;
    }
  }
}

export function makeDefinition<
  const InputTypes extends any[],
  const OutputType,
>(
  // [...] wrapper is important, see also: https://stackoverflow.com/a/63891197
  inputs: [...{ [K in keyof InputTypes]: FRType<InputTypes[K]> }],
  output: FRType<OutputType>,
  run: (args: InputTypes, context: Interpreter) => OutputType,
  params?: { deprecated?: string; isDecorator?: boolean }
): FnDefinition {
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
    minInputs: inputs.filter((t) => !isOptional(t)).length,
    maxInputs: inputs.length,
  };
}

//Some definitions are just used to guard against ambiguous function calls, and should never be called.
export function makeAssertDefinition<const T extends any[]>(
  // [...] wrapper is important, see also: https://stackoverflow.com/a/63891197
  inputs: [...{ [K in keyof T]: FRType<T[K]> }],
  errorMsg: string
): FnDefinition {
  assertOptionalsAreAtEnd(inputs);
  return {
    inputs,
    output: frAny(),
    run: () => {
      throw new REAmbiguous(errorMsg);
    },
    isAssert: true,
    minInputs: inputs.filter((t) => !isOptional(t)).length,
    maxInputs: inputs.length,
  };
}

export function tryCallFnDefinition(
  fn: FnDefinition,
  args: Value[],
  context: Interpreter
): Value | undefined {
  if (args.length < fn.minInputs || args.length > fn.maxInputs) {
    return; // args length mismatch
  }
  const unpackedArgs: any = []; // any, but that's ok, type safety is guaranteed by FnDefinition type
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    const unpackedArg = fn.inputs[i].unpack(arg);
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

  return fn.output.pack(fn.run(unpackedArgs, context));
}

export function fnDefinitionToString(fn: FnDefinition): string {
  const inputs = fn.inputs
    .map((t) => t.display() + (isOptional(t) && t.tag !== "named" ? "?" : ""))
    .join(", ");
  const output = fn.output.display();
  return `(${inputs})${output ? ` => ${output}` : ""}`;
}
