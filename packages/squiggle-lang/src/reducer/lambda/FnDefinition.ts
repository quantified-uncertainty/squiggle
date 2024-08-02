import { REAmbiguous } from "../../errors/messages.js";
import { UnwrapType } from "../../types/helpers.js";
import { tAny } from "../../types/index.js";
import { Type } from "../../types/Type.js";
import { Value } from "../../value/index.js";
import { Reducer } from "../Reducer.js";
import { fnInput, FnInput } from "./FnInput.js";

/**
 * FnDefinition represents a single builtin lambda implementation.
 *
 * Squiggle builtin functions are, in general, polymorphic: they can dispatch on
 * the types of their arguments.
 *
 * So each builtin lambda, represented by `BuiltinLambda`, has a list of `FnDefinition`s.
 */

// Type safety of `FnDefinition is guaranteed by `makeDefinition` signature below and by `Type` unpack logic.
// It won't be possible to make `FnDefinition` generic without sacrificing type safety in other parts of the codebase,
// because of contravariance (we need to store all FnDefinitions in a generic array later on).
export class FnDefinition<OutputType = any> {
  inputs: FnInput<any>[];
  run: (args: any[], reducer: Reducer) => OutputType;
  output: Type<OutputType>;
  minInputs: number;
  maxInputs: number;
  isAssert: boolean;
  // If set, the function can be used as a decorator.
  // Note that the name will always be prepended with `Tag.`, so it makes sense only on function in `Tag` namespace.
  isDecorator: boolean;
  // We don't use the string value right now, but could later on.
  deprecated?: string;

  constructor(props: {
    inputs: FnInput<any>[];
    run: (args: any[], reducer: Reducer) => OutputType;
    output: Type<OutputType>;
    isAssert?: boolean;
    deprecated?: string;
    isDecorator?: boolean;
  }) {
    // Make sure that there are no non-optional inputs after optional inputs:
    {
      let optionalFound = false;
      for (const input of props.inputs) {
        if (optionalFound && !input.optional) {
          throw new Error(
            `Optional inputs must be last. Found non-optional input after optional input. ${props.inputs}`
          );
        }
        if (input.optional) {
          optionalFound = true;
        }
      }
    }

    this.inputs = props.inputs;
    this.run = props.run;
    this.output = props.output;
    this.isAssert = props.isAssert ?? false;
    this.isDecorator = props.isDecorator ?? false;
    this.deprecated = props.deprecated;

    this.minInputs = this.inputs.filter((t) => !t.optional).length;
    this.maxInputs = this.inputs.length;
  }

  showInDocumentation(): boolean {
    return !this.isAssert && !this.deprecated;
  }

  toString() {
    const inputs = this.inputs.map((t) => t.toString()).join(", ");
    const output = this.output.display();
    return `(${inputs})${output ? ` => ${output}` : ""}`;
  }

  tryCall(args: Value[], reducer: Reducer): Value | undefined {
    if (args.length < this.minInputs || args.length > this.maxInputs) {
      return; // args length mismatch
    }

    const unpackedArgs: any = []; // any, but that's ok, type safety is guaranteed by FnDefinition type
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      const unpackedArg = this.inputs[i].type.unpack(arg);
      if (unpackedArg === undefined) {
        // type mismatch
        return;
      }
      unpackedArgs.push(unpackedArg);
    }

    // Fill in missing optional arguments with nulls.
    // This is important, because empty optionals should be nulls, but without this they would be undefined.
    if (unpackedArgs.length < this.maxInputs) {
      unpackedArgs.push(
        ...Array(this.maxInputs - unpackedArgs.length).fill(null)
      );
    }

    return this.output.pack(this.run(unpackedArgs, reducer));
  }

  static make<const InputTypes extends InputOrType<any>[], const OutputType>(
    // [...] wrapper is important, see also: https://stackoverflow.com/a/63891197
    maybeInputs: InputTypes,
    output: Type<OutputType>,
    run: (
      args: [...{ [K in keyof InputTypes]: UnwrapInputOrType<InputTypes[K]> }],
      reducer: Reducer
    ) => OutputType,
    params?: { deprecated?: string; isDecorator?: boolean }
  ): FnDefinition<OutputType> {
    const inputs = maybeInputs.map(inputOrTypeToInput);

    return new FnDefinition({
      inputs,
      output,
      // Type of `run` argument must match `FnDefinition['run']`. This
      // This unsafe type casting is necessary because function type parameters are contravariant.
      run: run as FnDefinition["run"],
      deprecated: params?.deprecated,
      isDecorator: params?.isDecorator,
    });
  }

  //Some definitions are just used to guard against ambiguous function calls, and should never be called.
  static makeAssert<const T extends any[]>(
    // [...] wrapper is important, see also: https://stackoverflow.com/a/63891197
    maybeInputs: [...{ [K in keyof T]: InputOrType<T[K]> }],
    errorMsg: string
  ): FnDefinition {
    const inputs = maybeInputs.map(inputOrTypeToInput);

    return new FnDefinition({
      inputs,
      output: tAny(),
      run: () => {
        throw new REAmbiguous(errorMsg);
      },
      isAssert: true,
    });
  }
}

export type InputOrType<T> = FnInput<Type<T>> | Type<T>;

type UnwrapInputOrType<T extends InputOrType<any>> =
  T extends FnInput<infer U>
    ? UnwrapType<U>
    : T extends Type<any>
      ? UnwrapType<T>
      : never;

export function inputOrTypeToInput<T>(input: InputOrType<T>): FnInput<Type<T>> {
  return input instanceof FnInput ? input : fnInput({ type: input });
}

// Trivial wrapper around `FnDefinition.make` to make it easier to use in the codebase.
export function makeDefinition<
  const InputTypes extends InputOrType<any>[],
  const OutputType,
>(
  // TODO - is there a more elegant way to type this?
  maybeInputs: Parameters<typeof FnDefinition.make<InputTypes, OutputType>>[0],
  output: Parameters<typeof FnDefinition.make<InputTypes, OutputType>>[1],
  run: Parameters<typeof FnDefinition.make<InputTypes, OutputType>>[2],
  params?: Parameters<typeof FnDefinition.make<InputTypes, OutputType>>[3]
) {
  return FnDefinition.make(maybeInputs, output, run, params);
}
