import { ReducerContext } from "../../reducer/Context";
import * as IError from "../../reducer/IError";
import { rsResult } from "../../rsResult";
import * as RSResult from "../../rsResult";
import { ReducerFn, Value } from "../../value";
import {
  FnDefinition,
  fnDefinitionToString,
  tryCallFnDefinition,
} from "./fnDefinition";

type InternalExpressionValueType = unknown;

export type FRFunction = {
  name: string;
  nameSpace: string;
  requiresNamespace: boolean;
  definitions: FnDefinition[];
  output?: InternalExpressionValueType;
  examples?: string[];
  description?: string;
  isExperimental?: boolean;
};

// module FRType = {
//   let rec matchWithValue = (t: t, r: Reducer_T.value): bool =>
//     switch (t, r) {
//     | (FRTypeRecord(recordParams), IEvRecord(map)) =>
//       recordParams->E.A.every(((name, input)) => {
//         switch map->Belt.Map.String.get(name) {
//         | Some(v) => matchWithValue(input, v)
//         | None => false
//         }
//       })
//     | _ => false
//     }

//   let matchWithValueArray = (inputs: array<t>, args: array<Reducer_T.value>): bool => {
//     let isSameLength = E.A.length(inputs) == E.A.length(args)
//     if !isSameLength {
//       false
//     } else {
//       E.A.zip(inputs, args)->E.A.every(((input, arg)) => matchWithValue(input, arg))
//     }
//   }
// }

//   type functionJson = {
//     name: string,
//     definitions: array<string>,
//     examples: array<string>,
//     description: option<string>,
//     isExperimental: bool,
//   }

//   let make = (
//     ~name,
//     ~nameSpace,
//     ~requiresNamespace,
//     ~definitions,
//     ~examples=?,
//     ~output=?,
//     ~description=?,
//     ~isExperimental=false,
//     (),
//   ): t => {
//     name,
//     nameSpace,
//     definitions,
//     output,
//     examples: examples->E.O.default([]),
//     isExperimental,
//     requiresNamespace,
//     description,
//   }

//   let toJson = (t: t): functionJson => {
//     name: t.name,
//     definitions: t.definitions->E.A.fmap(FnDefinition.toString),
//     examples: t.examples,
//     description: t.description,
//     isExperimental: t.isExperimental,
//   }
// }

//   let toJson = (r: registry) => r.functions->E.A.fmap(Function.toJson)
//   let allExamples = (r: registry) => r.functions->E.A.fmap(r => r.examples)->E.A.concatMany
//   let allExamplesWithFns = (r: registry) =>
//     r.functions->E.A.fmap(fn => fn.examples->E.A.fmap(example => (fn, example)))->E.A.concatMany

type FnNameDict = Map<string, FnDefinition[]>;
type Registry = {
  functions: FRFunction[];
  fnNameDict: FnNameDict;
};

export const allNames = (r: Registry): string[] => [...r.fnNameDict.keys()];

export const make = (fns: FRFunction[]): Registry => {
  const dict: FnNameDict = new Map<string, FnDefinition[]>();
  // Three layers of reduce:
  // 1. functions
  // 2. definitions of each function
  // 3. name variations of each definition
  for (const fn of fns) {
    for (const def of fn.definitions) {
      const names = [
        ...(fn.nameSpace == "" ? [] : [`${fn.nameSpace}.${def.name}`]),
        ...(fn.requiresNamespace ? [] : [def.name]),
      ];

      for (const name of names) {
        if (dict.has(name)) {
          dict.get(name)?.push(def);
        } else {
          dict.set(name, [def]);
        }
      }
    }
  }
  return { functions: fns, fnNameDict: dict };
};

export const call = (
  registry: Registry,
  fnName: string,
  args: Value[],
  context: ReducerContext,
  reducer: ReducerFn
): rsResult<Value, IError.Message> => {
  const definitions = registry.fnNameDict.get(fnName);
  if (definitions === undefined) {
    return RSResult.Error(IError.RESymbolNotFound(fnName));
  }
  const showNameMatchDefinitions = () => {
    const defsString = definitions
      .map(fnDefinitionToString)
      .map((r) => `[${r}]`)
      .join("; ");
    return `There are function matches for ${fnName}(), but with different arguments: ${defsString}`;
  };

  for (const definition of definitions) {
    const callResult = tryCallFnDefinition(definition, args, context, reducer);
    if (callResult !== undefined) {
      return callResult;
    }
  }
  return RSResult.Error(IError.REOther(showNameMatchDefinitions()));
};
