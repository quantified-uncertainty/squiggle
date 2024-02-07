import { Env } from "../dist/env.js";
import { getNativeRng, PRNG } from "../rng/index.js";
import { FrameStack, topFrameName } from "./frameStack.js";
import { evaluate, ReducerFn } from "./index.js";
import { BaseLambda } from "./lambda.js";
import { Stack } from "./stack.js";

export type ReducerContext = Readonly<{
  stack: Stack;
  environment: Env;
  frameStack: FrameStack;
  evaluate: ReducerFn;
  inFunction: BaseLambda | undefined;
  rng: PRNG;
}>;

export function createContext(environment: Env): ReducerContext {
  // const seed = environment.seed
  //   ? String(environment.seed)
  //   : String(Math.random());

  return {
    stack: Stack.make(),
    environment,
    frameStack: FrameStack.make(),
    evaluate,
    inFunction: undefined,
    rng: getNativeRng(),
  };
}

export function currentFunctionName(t: ReducerContext): string {
  return t.inFunction === undefined ? topFrameName : t.inFunction.display();
}
