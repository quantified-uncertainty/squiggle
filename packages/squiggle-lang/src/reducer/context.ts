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
  inFunction?: Lambda;
}>;

export const createContext = (
  stdLib: Namespace,
  environment: Env
): ReducerContext => ({
  frameStack: FrameStack.make(),
  bindings: Bindings.fromNamespace(stdLib).extend(),
  evaluate,
  environment,
});

export const currentFunctionName = (t: ReducerContext): string => {
  return t.inFunction === undefined ? topFrameName : t.inFunction.getName();
};
