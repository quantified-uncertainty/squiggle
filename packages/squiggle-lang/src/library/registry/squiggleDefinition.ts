import { parse } from "../../ast/parse.js";
import { expressionFromAst } from "../../ast/toExpression.js";
import { ReducerContext } from "../../reducer/Context.js";
import { SquiggleLambda } from "../../reducer/lambda.js";
import * as Result from "../../utility/result.js";
import { ReducerFn } from "../../value/index.js";
import { FnDefinition, FnDefinition0, FnDefinition1 } from "./fnDefinition.js";
import { FRType } from "./frTypes.js";

export function makeSquiggleDefinition(args: {
  name: string;
  inputs: [];
  parameters: [];
  code: string;
}): FnDefinition0;

export function makeSquiggleDefinition<T1>(args: {
  name: string;
  inputs: [FRType<T1>];
  parameters: [string];
  code: string;
}): FnDefinition1<T1>;

// TODO - add support for more inputs, in the same fashion as we do in ./fnDefinition.js

export function makeSquiggleDefinition({
  name,
  inputs,
  parameters,
  code,
}: {
  name: string; // unfortunately necessary, so that lambda isn't anonymous
  inputs: FRType<unknown>[];
  parameters: string[];
  code: string;
}): FnDefinition {
  const astResult = parse(code, "@stdlib");
  if (!astResult.ok) {
    // will be detected during tests, should never happen in runtime
    throw new Error(`Stdlib code ${code} is invalid`);
  }

  const expression = expressionFromAst(astResult.value);

  const run = (
    args: unknown[],
    context: ReducerContext,
    reducer: ReducerFn
  ) => {
    // It would be better to create this lambda outside of `run` instead of creating it on every call.
    // But we don't have access to `context.bindings` outside of `run`, and it's not clear how the code
    // could reference stdlib functions in that case.
    const lambda = new SquiggleLambda(
      name,
      parameters,
      // Look for uppermost bindings scope, which will contain stdlib.
      // This way we guarantee that function implementation can't touch local variables,
      // and that local variables won't override stdlib references in function's body.
      context.bindings.root(),
      expression,
      astResult.value.location
    );

    const result = lambda.call(
      // It's unfortunate that we have to unpack values and repack them again.
      // But it's the only way to support polymorphic functions and make use of error reporting mechanism in our registry.
      inputs.map((input, i) => input.pack(args[i])),
      context,
      reducer
    );
    return Result.Ok(result);
  };

  return { inputs: inputs as any, run: run as any };
}
