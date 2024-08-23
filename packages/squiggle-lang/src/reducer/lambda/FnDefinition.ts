import { ErrorMessage } from "../../errors/messages.js";
import { FrInput } from "../../library/FrInput.js";
import { frAny, FrType, UnwrapFrType } from "../../library/FrType.js";
import { tTypedLambda } from "../../types/index.js";
import { TTypedLambda } from "../../types/TTypedLambda.js";
import { Value } from "../../value/index.js";
import { Reducer } from "../Reducer.js";

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
  inputs: FrInput<unknown>[];
  output: FrType<unknown>;

  signature: TTypedLambda;
  run: (args: unknown[], reducer: Reducer) => unknown;
  isAssert: boolean;
  // If set, the function can be used as a decorator.
  // Note that the name will always be prepended with `Tag.`, so it makes sense only on function in `Tag` namespace.
  isDecorator: boolean;
  // We don't use the string value right now, but could later on.
  deprecated?: string;

  private constructor(props: {
    inputs: FrInput<unknown>[];
    output: FrType<unknown>;
    run: (args: unknown[], reducer: Reducer) => unknown;
    isAssert?: boolean;
    deprecated?: string;
    isDecorator?: boolean;
  }) {
    this.inputs = props.inputs;
    this.output = props.output;

    this.signature = tTypedLambda(
      this.inputs.map((input) => input.toFnInput()),
      this.output.type
    );

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
    if (
      args.length < this.signature.minInputs ||
      args.length > this.signature.maxInputs
    ) {
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
    if (unpackedArgs.length < this.signature.maxInputs) {
      unpackedArgs.push(
        ...Array(this.signature.maxInputs - unpackedArgs.length).fill(null)
      );
    }

    if (!unpackedArgs) {
      return;
    }

    return this.output.pack(this.run(unpackedArgs, reducer));
  }

  static make<const MaybeInputTypes extends InputOrType<any>[], const Output>(
    maybeInputs: MaybeInputTypes,
    output: FrType<Output>,
    run: (
      // [...] wrapper is important, see also: https://stackoverflow.com/a/63891197
      args: [
        ...{
          [K in keyof MaybeInputTypes]: UnwrapInputOrType<MaybeInputTypes[K]>;
        },
      ],
      reducer: Reducer
    ) => Output,
    params?: { deprecated?: string; isDecorator?: boolean }
  ) {
    const inputs = maybeInputs.map(frInputOrTypeToFrInput);
    return new FnDefinition({
      inputs,
      output: output as FrType<unknown>,
      // Type of `run` argument must match `FnDefinition['run']`. This
      // This unsafe type casting is necessary because function type parameters are contravariant.
      run: run as FnDefinition["run"],
      deprecated: params?.deprecated,
      isDecorator: params?.isDecorator,
    });
  }

  //Some definitions are just used to guard against ambiguous function calls, and should never be called.
  static makeAssert<const MaybeInputTypes extends InputOrType<any>[]>(
    maybeInputs: MaybeInputTypes,
    errorMsg: string
  ) {
    const inputs = maybeInputs.map(frInputOrTypeToFrInput);

    return new FnDefinition({
      inputs,
      output: frAny() as FrType<unknown>,
      run: () => {
        throw ErrorMessage.ambiguousError(errorMsg);
      },
      isAssert: true,
    });
  }
}

type InputOrType<T> = FrInput<T> | FrType<T>;

type UnwrapInput<T extends FrInput<any>> =
  T extends FrInput<infer U> ? U : never;

type UnwrapInputOrType<T extends InputOrType<any>> =
  T extends FrInput<any>
    ? UnwrapInput<T>
    : T extends FrType<any>
      ? UnwrapFrType<T>
      : never;

function frInputOrTypeToFrInput<T>(input: InputOrType<T>): FrInput<T> {
  return input instanceof FrInput ? input : new FrInput({ type: input });
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
