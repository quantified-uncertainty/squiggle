import { REAmbiguous } from "../../errors/messages.js";
import { UnwrapType } from "../../types/helpers.js";
import { tAny, tTypedLambda } from "../../types/index.js";
import { TTypedLambda } from "../../types/TTypedLambda.js";
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
export class FnDefinition {
  signature: TTypedLambda;
  run: (args: unknown[], reducer: Reducer) => unknown;
  isAssert: boolean;
  // If set, the function can be used as a decorator.
  // Note that the name will always be prepended with `Tag.`, so it makes sense only on function in `Tag` namespace.
  isDecorator: boolean;
  // We don't use the string value right now, but could later on.
  deprecated?: string;

  private constructor(props: {
    signature: TTypedLambda;
    run: (args: unknown[], reducer: Reducer) => unknown;
    isAssert?: boolean;
    deprecated?: string;
    isDecorator?: boolean;
  }) {
    this.signature = props.signature;
    this.run = props.run;
    this.isAssert = props.isAssert ?? false;
    this.isDecorator = props.isDecorator ?? false;
    this.deprecated = props.deprecated;
  }

  showInDocumentation(): boolean {
    return !this.isAssert && !this.deprecated;
  }

  toString() {
    return this.signature.toString();
  }

  tryCall(args: Value[], reducer: Reducer): Value | undefined {
    const unpackedArgs = this.signature.validateAndUnpackArgs(args);
    if (!unpackedArgs) {
      return;
    }

    return this.signature.output.pack(this.run(unpackedArgs, reducer));
  }

  static make<const MaybeInputTypes extends InputOrType<any>[], const Output>(
    // [...] wrapper is important, see also: https://stackoverflow.com/a/63891197
    maybeInputs: MaybeInputTypes,
    output: Type<Output>,
    run: (
      args: [
        ...{
          [K in keyof MaybeInputTypes]: UnwrapInputOrType<MaybeInputTypes[K]>;
        },
      ],
      reducer: Reducer
    ) => Output,
    params?: { deprecated?: string; isDecorator?: boolean }
  ) {
    type InputTypes = UpgradeMaybeInputTypes<MaybeInputTypes>;

    const inputs = maybeInputs.map(inputOrTypeToInput) as InputTypes;

    return new FnDefinition({
      signature: tTypedLambda(inputs, output),
      // Type of `run` argument must match `FnDefinition['run']`. This
      // This unsafe type casting is necessary because function type parameters are contravariant.
      run: run as FnDefinition["run"],
      deprecated: params?.deprecated,
      isDecorator: params?.isDecorator,
    });
  }

  //Some definitions are just used to guard against ambiguous function calls, and should never be called.
  static makeAssert<const MaybeInputTypes extends InputOrType<any>[]>(
    // [...] wrapper is important, see also: https://stackoverflow.com/a/63891197
    maybeInputs: MaybeInputTypes,
    errorMsg: string
  ) {
    type InputTypes = UpgradeMaybeInputTypes<MaybeInputTypes>;

    const inputs = maybeInputs.map(inputOrTypeToInput) as InputTypes;

    return new FnDefinition({
      signature: tTypedLambda(inputs, tAny()),
      run: () => {
        throw new REAmbiguous(errorMsg);
      },
      isAssert: true,
    });
  }
}

type UpgradeMaybeInputTypes<T extends InputOrType<any>[]> = [
  ...{
    [K in keyof T]: T[K] extends FnInput<any>
      ? T[K]
      : T[K] extends Type<infer T>
        ? FnInput<T>
        : never;
  },
];

export type InputOrType<T> = FnInput<T> | Type<T>;

type UnwrapInput<T extends FnInput<any>> =
  T extends FnInput<infer U> ? U : never;

type UnwrapInputOrType<T extends InputOrType<any>> =
  T extends FnInput<any>
    ? UnwrapInput<T>
    : T extends Type<any>
      ? UnwrapType<T>
      : never;

export function inputOrTypeToInput<T>(input: InputOrType<T>): FnInput<T> {
  return input instanceof FnInput ? input : fnInput({ type: input });
}

// Trivial wrapper around `FnDefinition.make` to make it easier to use in the codebase.
export function makeDefinition<
  const InputTypes extends InputOrType<any>[],
  const Output, // it's better to use Output and not OutputType; otherwise `run` return type will require `const` on strings
>(
  // TODO - is there a more elegant way to type this?
  maybeInputs: Parameters<typeof FnDefinition.make<InputTypes, Output>>[0],
  output: Parameters<typeof FnDefinition.make<InputTypes, Output>>[1],
  run: Parameters<typeof FnDefinition.make<InputTypes, Output>>[2],
  params?: Parameters<typeof FnDefinition.make<InputTypes, Output>>[3]
) {
  return FnDefinition.make(maybeInputs, output, run, params);
}
