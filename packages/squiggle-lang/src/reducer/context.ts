import { Env } from "../dist/env.js";
import { getNativeRng, PRNG } from "../rng/index.js";
import { Value } from "../value/index.js";
import { FrameStack } from "./frameStack.js";
import { evaluate, ReducerFn } from "./index.js";
import { Stack } from "./stack.js";

export type ReducerContext = {
  readonly stack: Stack;
  captures: Value[];
  readonly environment: Readonly<Env>;
  readonly frameStack: FrameStack;
  evaluate: ReducerFn;
  readonly rng: PRNG;
};

export function createContext(environment: Env): ReducerContext {
  // const seed = environment.seed
  //   ? String(environment.seed)
  //   : String(Math.random());

  return {
    stack: Stack.make(),
    captures: [],
    environment,
    frameStack: FrameStack.make(),
    evaluate,
    rng: getNativeRng(),
  };
}
