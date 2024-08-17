import { analyzeAst } from "../../analysis/index.js";
import { parse } from "../../ast/parse.js";
import { compileTypedAst } from "../../compiler/index.js";
import { defaultEnv } from "../../dists/env.js";
import { ICompileError } from "../../errors/IError.js";
import { Reducer } from "../../reducer/Reducer.js";
import { Bindings } from "../../reducer/Stack.js";
import { Value } from "../../value/index.js";

type SquiggleDefinition = {
  name: string;
  value: Value;
};

const stdlibSourceId = "@stdlib";

// useful for debugging; should never happen outside of squiggle development
function rethrowCompileError(error: ICompileError, code: string): never {
  throw new Error(
    error.toString({
      withLocation: true,
      resolveSource: (sourceId) => (sourceId === stdlibSourceId ? code : ""),
    })
  );
}

export function makeSquiggleDefinition({
  builtins,
  name,
  code,
}: {
  builtins: Bindings;
  name: string;
  code: string;
}): SquiggleDefinition {
  const astResult = parse(code, stdlibSourceId);
  if (!astResult.ok) {
    // will be detected during tests, should never happen in runtime
    throw new Error(`Stdlib code ${code} is invalid`);
  }

  const typedAst = analyzeAst(astResult.value, builtins);

  if (!typedAst.ok) {
    rethrowCompileError(typedAst.value, code);
  }

  const irResult = compileTypedAst({
    ast: typedAst.value,
    stdlib: builtins,
    imports: {},
  });

  if (!irResult.ok) {
    rethrowCompileError(irResult.value, code);
  }

  // TODO - do we need runtime env? That would mean that we'd have to build stdlib for each env separately.
  const reducer = new Reducer(defaultEnv);
  const { result: value } = reducer.evaluate(irResult.value);

  return { name, value };
}
