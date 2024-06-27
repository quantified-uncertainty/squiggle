import { AST } from "../../ast/types.js";
import { Env } from "../../dists/env.js";
import { RunOutput } from "../../runners/BaseRunner.js";
import { result } from "../../utility/result.js";
import { VDict } from "../../value/VDict.js";
import { SqError } from "../SqError.js";

// source -> ast -> imports -> output

export type Externals = {
  implicitImports: VDict;
  explicitImports: VDict;
};

// Every time we run the item and cache its `ProjectItemOutput`, we also store the context that was used for that run.
// This context is useful later for constructing `SqOutput`, and also for `SqValueContext`.
// This type is similar to `RunParams` from the runners APIs, but has enough differences to be separate.
export type RunContext = {
  ast: AST;
  sourceId: string;
  source: string;
  environment: Env;
  externals: Externals;
};

export type ProjectItemOutput = {
  context: RunContext;
  runOutput: RunOutput;
  executionTime: number; // milliseconds
};

export type ProjectItemOutputResult = result<
  ProjectItemOutput,
  /*
   * `IError` would be more appropriate, because `ProjectItemOutput` is not
   * SqValue-upgraded yet at this point.
   *
   * Unfortunately, `IError` only covers runtime and compile-time errors, while
   * this type can also contain linker errors when `ProjectItem.failRun` is
   * called.
   */
  SqError
>;
