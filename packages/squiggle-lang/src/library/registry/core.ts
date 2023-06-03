import { ReducerContext } from "../../reducer/Context.js";
import { result } from "../../utility/result.js";
import * as Result from "../../utility/result.js";
import { ReducerFn, Value } from "../../value/index.js";
import {
  FnDefinition,
  fnDefinitionToString,
  tryCallFnDefinition,
} from "./fnDefinition.js";
import {
  ErrorMessage,
  REOther,
  RESymbolNotFound,
} from "../../reducer/ErrorMessage.js";
import { BuiltinLambda, Lambda } from "../../reducer/lambda.js";

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

export class Registry {
  private constructor(
    private functions: FRFunction[],
    private fnNameDict: FnNameDict
  ) {}

  static make(fns: FRFunction[]) {
    const dict: FnNameDict = new Map();
    // Three layers of reduce:
    // 1. functions
    // 2. definitions of each function
    // 3. name variations of each definition
    for (const fn of fns) {
      for (const def of fn.definitions) {
        const names = [
          ...(fn.nameSpace == "" ? [] : [`${fn.nameSpace}.${fn.name}`]),
          ...(fn.requiresNamespace ? [] : [fn.name]),
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
    return new Registry(fns, dict);
  }

  allExamplesWithFns(): { fn: FRFunction; example: string }[] {
    return this.functions
      .map(
        (fn) =>
          fn.examples?.map((example) => ({
            fn,
            example,
          })) ?? []
      )
      .flat();
  }

  allNames(): string[] {
    return [...this.fnNameDict.keys()];
  }

  call(
    fnName: string,
    args: Value[],
    context: ReducerContext,
    reducer: ReducerFn
  ): result<Value, ErrorMessage> {
    const definitions = this.fnNameDict.get(fnName);
    if (definitions === undefined) {
      return Result.Error(RESymbolNotFound(fnName));
    }
    const showNameMatchDefinitions = () => {
      const defsString = definitions
        .map(fnDefinitionToString)
        .map((def) => `  ${fnName}${def}\n`)
        .join("");
      return `There are function matches for ${fnName}(), but with different arguments:\n${defsString}`;
    };

    for (const definition of definitions) {
      const callResult = tryCallFnDefinition(
        definition,
        args,
        context,
        reducer
      );
      if (callResult !== undefined) {
        return callResult;
      }
    }
    return Result.Error(REOther(showNameMatchDefinitions()));
  }

  makeLambda(fnName: string): Lambda {
    if (!this.fnNameDict.get(fnName)) {
      throw new Error(`Function ${fnName} doesn't exist in registry`);
    }
    return new BuiltinLambda(fnName, (args, context, reducer) => {
      // Note: current bindings could be accidentally exposed here through context (compare with native lambda implementation above, where we override them with local bindings).
      // But FunctionRegistry API is too limited for that to matter. Please take care not to violate that in the future by accident.
      const result = this.call(fnName, args, context, reducer);
      if (!result.ok) {
        return ErrorMessage.throw(result.value);
      }
      return result.value;
    });
  }
}
