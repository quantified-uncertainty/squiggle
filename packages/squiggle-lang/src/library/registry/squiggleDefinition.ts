import { parse } from "../../ast/parse.js";
import { defaultEnv } from "../../dist/env.js";
import { compileAst } from "../../expression/compile.js";
import { createContext } from "../../reducer/context.js";
import { Bindings } from "../../reducer/stack.js";
import { Value } from "../../value/index.js";

export type SquiggleDefinition = {
  name: string;
  value: Value;
};

export function makeSquiggleDefinition({
  builtins,
  name,
  code,
}: {
  builtins: Bindings;
  name: string;
  code: string;
}): SquiggleDefinition {
  const astResult = parse(code, "@stdlib");
  if (!astResult.ok) {
    // will be detected during tests, should never happen in runtime
    throw new Error(`Stdlib code ${code} is invalid`);
  }

  const expressionResult = compileAst(astResult.value, builtins);

  if (!expressionResult.ok) {
    // fail fast
    throw expressionResult.value;
  }

  // TODO - do we need runtime env? That would mean that we'd have to build stdlib for each env separately.
  const context = createContext(defaultEnv);
  const [value] = context.evaluate(expressionResult.value, context);

  return { name, value };
}
