import { parse } from "../../ast/parse.js";
import { expressionFromAst } from "../../expression/fromAst.js";
import { ReducerContext } from "../../reducer/context.js";
import { ReducerFn } from "../../reducer/index.js";
import { SquiggleLambda } from "../../reducer/lambda.js";
import * as Result from "../../utility/result.js";
import { FnDefinition } from "./fnDefinition.js";
import { FRType } from "./frTypes.js";

export function makeSquiggleDefinition<const T extends string[]>({
  name,
  inputs,
  parameters,
  code,
}: {
  name: string; // unfortunately necessary, so that lambda isn't anonymous
  // guarantees that both arrays have the same length
  inputs: [...{ [K in keyof T]: FRType<any> }];
  parameters: [...T];
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
