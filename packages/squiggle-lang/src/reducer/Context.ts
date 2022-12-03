import { Env } from "../dist/env";
import { Bindings, Namespace } from "./bindings";
import { FrameStack, topFrameName } from "./frameStack";
import { Lambda } from "./lambda";

export type ReducerContext = Readonly<{
  bindings: Bindings;
  environment: Env;
  frameStack: FrameStack;
  inFunction?: Lambda;
}>;

export const createContext = (
  stdLib: Namespace,
  environment: Env
): ReducerContext => ({
  frameStack: FrameStack.make(),
  bindings: Bindings.fromNamespace(stdLib).extend(),
  environment,
});

export const currentFunctionName = (t: ReducerContext): string => {
  return t.inFunction === undefined ? topFrameName : t.inFunction.getName();
};
