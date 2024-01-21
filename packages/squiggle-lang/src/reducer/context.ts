import seedrandom from "seedrandom";

import { Env } from "../dist/env.js";
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
  rng: seedrandom.PRNG;
}>;

export function createContext(environment: Env): ReducerContext {
  return {
    stack: Stack.make(),
    environment,
    frameStack: FrameStack.make(),
    evaluate,
    inFunction: undefined,
    rng: seedrandom.alea(
      environment.seed === undefined ? undefined : String(environment.seed)
    ),
  };
}

export function currentFunctionName(t: ReducerContext): string {
  return t.inFunction === undefined ? topFrameName : t.inFunction.display();
}
