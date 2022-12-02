import { ReducerContext } from "../../reducer/Context";
import { ErrorMessage } from "../../reducer/ErrorMessage";
import { result } from "../../utility/result";
import { ReducerFn, Value } from "../../value";
import { FRType } from "./frTypes";

type FnDefinition1<T1> = {
  name: string;
  inputs: [FRType<T1>];
  run: (
    args: [T1],
    context: ReducerContext,
    reducerFn: ReducerFn
  ) => result<Value, ErrorMessage>;
};

type FnDefinition2<T1, T2> = {
  name: string;
  inputs: [FRType<T1>, FRType<T2>];
  run: (
    args: [T1, T2],
    context: ReducerContext,
    reducerFn: ReducerFn
  ) => result<Value, ErrorMessage>;
};

type FnDefinition3<T1, T2, T3> = {
  name: string;
  inputs: [FRType<T1>, FRType<T2>, FRType<T3>];
  run: (
    args: [T1, T2, T3],
    context: ReducerContext,
    reducerFn: ReducerFn
  ) => result<Value, ErrorMessage>;
};

type FnDefinition4<T1, T2, T3, T4> = {
  name: string;
  inputs: [FRType<T1>, FRType<T2>, FRType<T3>, FRType<T4>];
  run: (
    args: [T1, T2, T3, T4],
    context: ReducerContext,
    reducerFn: ReducerFn
  ) => result<Value, ErrorMessage>;
};

// https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads

export function makeDefinition<T1>(
  name: string,
  inputs: [FRType<T1>],
  run: (
    args: [T1],
    context: ReducerContext,
    reducerFn: ReducerFn
  ) => result<Value, ErrorMessage>
): FnDefinition1<T1>;

export function makeDefinition<T1, T2>(
  name: string,
  inputs: [FRType<T1>, FRType<T2>],
  run: (
    args: [T1, T2],
    context: ReducerContext,
    reducerFn: ReducerFn
  ) => result<Value, ErrorMessage>
): FnDefinition2<T1, T2>;

export function makeDefinition<T1, T2, T3>(
  name: string,
  inputs: [FRType<T1>, FRType<T2>, FRType<T3>],
  run: (
    args: [T1, T2, T3],
    context: ReducerContext,
    reducerFn: ReducerFn
  ) => result<Value, ErrorMessage>
): FnDefinition3<T1, T2, T3>;

export function makeDefinition<T1, T2, T3, T4>(
  name: string,
  inputs: [FRType<T1>, FRType<T2>, FRType<T3>, FRType<T4>],
  run: (
    args: [T1, T2, T3, T4],
    context: ReducerContext,
    reducerFn: ReducerFn
  ) => result<Value, ErrorMessage>
): FnDefinition4<T1, T2, T3, T4>;

// `any` here is fine, this signature won't be visible due to function overloads above
export function makeDefinition(
  name: string,
  inputs: any,
  run: (
    args: any,
    context: ReducerContext,
    reducerFn: ReducerFn
  ) => result<Value, ErrorMessage>
): FnDefinition {
  return {
    name,
    inputs,
    run,
  };
}

export type FnDefinition =
  | FnDefinition1<any>
  | FnDefinition2<any, any>
  | FnDefinition3<any, any, any>
  | FnDefinition4<any, any, any, any>;

export const tryCallFnDefinition = (
  fn: FnDefinition,
  args: Value[],
  context: ReducerContext,
  reducerFn: ReducerFn
): result<Value, ErrorMessage> | undefined => {
  if (args.length !== fn.inputs.length) {
    return; // args length mismatch
  }
  const unpackedArgs: any[] = []; // any, but that's ok, type safety is guaranteed by FnDefinition type
  for (let i = 0; i < args.length; i++) {
    const unpackedArg = fn.inputs[i].unpack(args[i]);
    if (unpackedArg === undefined) {
      // type mismatch
      return;
    }
    unpackedArgs.push(unpackedArg);
  }
  return fn.run(unpackedArgs as any, context, reducerFn);
};

export const fnDefinitionToString = (fn: FnDefinition): string => {
  const inputs = fn.inputs.map((t) => t.getName()).join(", ");
  return `${fn.name}(${inputs})`;
};
