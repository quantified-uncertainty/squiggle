import {
  REArgumentError,
  REOther,
  RESymbolNotFound,
} from "../../errors/messages.js";
import { ReducerContext } from "../../reducer/context.js";
import { BuiltinLambda, Lambda } from "../../reducer/lambda.js";
import { Value } from "../../value/index.js";
import {
  FnDefinition,
  fnDefinitionToString,
  tryCallFnDefinition,
} from "./fnDefinition.js";

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

  call(fnName: string, args: Value[], context: ReducerContext): Value {
    const definitions = this.fnNameDict.get(fnName);
    if (definitions === undefined) {
      throw new RESymbolNotFound(fnName);
    }
    const formatErr = (
      fnName: string,
      defs: string,
      givenFn: string
    ) => `There are function matches for **\`${fnName}()\`**, but with different arguments:
\`\`\`js
${defs}
\`\`\`
Was given **\`${givenFn})\`**`;
    const showNameMatchDefinitions = () => {
      const defsString = definitions
        .map(fnDefinitionToString)
        .map((def) => `${fnName}${def}\n`)
        .join("");
      return formatErr(fnName, defsString, `${fnName}(${args.join(",")}`);
    };

    for (const definition of definitions) {
      const callResult = tryCallFnDefinition(definition, args, context);
      if (callResult !== undefined) {
        return callResult;
      }
    }
    throw new REArgumentError(showNameMatchDefinitions());
  }

  makeLambda(fnName: string): Lambda {
    if (!this.fnNameDict.has(fnName)) {
      throw new Error(`Function **\'${fnName}\'** doesn't exist in registry`);
    }
    return new BuiltinLambda(fnName, (args, context) => {
      // Note: current bindings could be accidentally exposed here through context (compare with native lambda implementation above, where we override them with local bindings).
      // But FunctionRegistry API is too limited for that to matter. Please take care not to violate that in the future by accident.
      return this.call(fnName, args, context);
    });
  }
}
