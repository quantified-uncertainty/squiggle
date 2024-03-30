import get from "lodash/get.js";
import invert from "lodash/invert.js";

import { infixFunctions, unaryFunctions } from "../../ast/peggyHelpers.js";
import { BuiltinLambda, Lambda } from "../../reducer/lambda.js";
import {
  FnDefinition,
  fnDefinitionToString,
  showInDocumentation,
} from "./fnDefinition.js";

type Shorthand = { type: "infix" | "unary"; symbol: string };

type Example = {
  text: string;
  isInteractive: boolean;
  useForTests: boolean;
};

export function makeFnExample(
  text: string,
  params: { isInteractive?: boolean; useForTests?: boolean } = {}
): Example {
  const { isInteractive = false, useForTests = true } = params;
  return { text, isInteractive, useForTests };
}

export type FRFunction = {
  name: string;
  nameSpace: string;
  requiresNamespace: boolean;
  definitions: FnDefinition[];
  examples?: Example[];
  description?: string;
  isExperimental?: boolean;
  isUnit?: boolean;
  shorthand?: Shorthand;
  displaySection?: string;
  versionAdded?: string;
};

function organizedExamples(f: FRFunction) {
  return [...(f.examples ?? [])];
}

type FnNameDict = Map<string, FnDefinition[]>;

export type FnDocumentation = FRFunction & { signatures: string[] };

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
        // We convert all fns of Foo.make() to also allow for Foo().
        const moduleConstructorName = fn.name === "make" ? fn.nameSpace : null;
        const names = [
          ...(fn.nameSpace === "" ? [] : [`${fn.nameSpace}.${fn.name}`]),
          ...(fn.requiresNamespace ? [] : [fn.name]),
          ...(moduleConstructorName ? [moduleConstructorName] : []),
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

  allExamplesWithFns(): { fn: FRFunction; example: Example }[] {
    return this.functions
      .map((fn) => {
        return organizedExamples(fn).map((example) => ({ fn, example }));
      })
      .flat();
  }

  allNames(): string[] {
    return [...this.fnNameDict.keys()];
  }

  allFunctionsWithNamespace(nameSpace: string): FRFunction[] {
    return this.functions.filter((fn) => fn.nameSpace === nameSpace);
  }

  getFunctionDocumentation(fnName: string): FnDocumentation | undefined {
    // Find the first function with a given name; there could be duplicates with different descriptions etc.
    // FIXME - store `this.functions` as a `Map`.
    const fn = this.functions.find((fn) => {
      // FIXME - duplicates the logic from `make`
      if (!fn.requiresNamespace && fnName === fn.name) {
        return true;
      }
      if (`${fn.nameSpace}.${fn.name}` === fnName) {
        return true;
      }
    });

    if (!fn) return;

    const _infixes = invert(infixFunctions);
    const _unary = invert(unaryFunctions);

    function getShorthandName(name: string): Shorthand | undefined {
      const infix: string | undefined = get(_infixes, name, undefined);
      if (infix) {
        return { type: "infix", symbol: infix };
      } else {
        const unary: string | undefined = get(_unary, name, undefined);
        if (unary) {
          return { type: "unary", symbol: unary };
        }
        return undefined;
      }
    }

    return {
      name: fn.name,
      nameSpace: fn.nameSpace,
      requiresNamespace: fn.requiresNamespace,
      description: fn.description,
      definitions: fn.definitions,
      examples: fn.examples,
      signatures: fn.definitions
        .filter((d) => showInDocumentation(d))
        .map(fnDefinitionToString),
      isUnit: fn.isUnit,
      shorthand: getShorthandName(fn.name),
      displaySection: fn.displaySection,
    };
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
