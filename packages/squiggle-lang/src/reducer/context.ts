import { Env } from "../dist/env.js";
import { Bindings, Namespace } from "./bindings.js";
import { FrameStack, topFrameName } from "./frameStack.js";
import { ReducerFn, evaluate } from "./index.js";
import { Lambda } from "./lambda.js";

export type ReducerContext = Readonly<{
  bindings: Bindings;
  environment: Env;
  frameStack: FrameStack;
  evaluate: ReducerFn;
  inFunction: Lambda | undefined;
}>;

export const createContext = (
  stdLib: Namespace,
  environment: Env
): ReducerContext => ({
  bindings: Bindings.fromNamespace(stdLib).extend(),
  environment,
  frameStack: FrameStack.make(),
  evaluate,
  inFunction: undefined,
});

export const currentFunctionName = (t: ReducerContext): string => {
  return t.inFunction === undefined ? topFrameName : t.inFunction.getName();
};
