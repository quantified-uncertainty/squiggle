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

export type FRFunction = {
  name: string;
  nameSpace: string;
  requiresNamespace: boolean;
  definitions: FnDefinition[];
  output?: Value["type"];
  examples?: string[];
  description?: string;
  isExperimental?: boolean;
};

type FnNameDict = Map<string, FnDefinition[]>;
type Registry = {
  functions: FRFunction[];
  fnNameDict: FnNameDict;
};

export const allExamplesWithFns = (
  r: Registry
): { fn: FRFunction; example: string }[] => {
  return r.functions
    .map(
      (fn) =>
        fn.examples?.map((example) => ({
          fn,
          example,
        })) ?? []
    )
    .flat();
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
