import { Env } from "../Dist/env";
import * as Bindings from "./bindings";
import * as FrameStack from "./FrameStack";
import * as Lambda from "./Lambda";
import { Namespace } from "./Namespace";

export type ReducerContext = Readonly<{
  bindings: Bindings.Bindings;
  environment: Env;
  frameStack: FrameStack.FrameStack;
  inFunction?: Lambda.Lambda;
}>;

export const createContext = (
  stdLib: Namespace,
  environment: Env
): ReducerContext => ({
  frameStack: FrameStack.make(),
  bindings: Bindings.extend(Bindings.fromNamespace(stdLib)),
  environment,
});

export const currentFunctionName = (t: ReducerContext): string => {
  return t.inFunction === undefined
    ? FrameStack.topFrameName
    : Lambda.getName(t.inFunction);
};
