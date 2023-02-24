import { Env } from "../dist/env";
import { Bindings, Namespace } from "./bindings";
import { FrameStack, topFrameName } from "./frameStack";
import { Profiler } from "./Profiler";
import { Lambda } from "./lambda";

export type ReducerContext = Readonly<{
  bindings: Bindings;
  environment: Env;
  frameStack: FrameStack;
  inFunction?: Lambda;
  profiler?: Profiler;
}>;

export const createContext = (
  stdLib: Namespace,
  environment: Env,
  profiler?: Profiler
): ReducerContext => ({
  frameStack: FrameStack.make(),
  bindings: Bindings.fromNamespace(stdLib).extend(),
  profiler: profiler,
  environment,
});

export const currentFunctionName = (t: ReducerContext): string => {
  return t.inFunction === undefined ? topFrameName : t.inFunction.getName();
};
