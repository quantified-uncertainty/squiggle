import { BuiltinLambda, Lambda } from "../../reducer/lambda.js";
import { Value } from "../../value/index.js";
import { FnDefinition } from "./fnDefinition.js";

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

  makeLambda(fnName: string): Lambda {
    const definitions = this.fnNameDict.get(fnName);
    if (definitions === undefined) {
      throw new Error(`Function ${fnName} has no definitions`);
    } else {
      return new BuiltinLambda(fnName, definitions);
    }
  }
}
