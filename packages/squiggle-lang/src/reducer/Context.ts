import { Env } from "../Dist/env";
import { Bindings, Namespace } from "./bindings";
import * as FrameStack from "./FrameStack";
import * as Lambda from "./Lambda";

export type ReducerContext = Readonly<{
  bindings: Bindings;
  environment: Env;
  frameStack: FrameStack.FrameStack;
  inFunction?: Lambda.Lambda;
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
  return t.inFunction === undefined
    ? FrameStack.topFrameName
    : Lambda.getName(t.inFunction);
};
