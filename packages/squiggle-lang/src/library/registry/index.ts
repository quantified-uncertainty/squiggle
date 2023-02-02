import { ReducerContext } from "../../reducer/Context";
import { Lambda } from "../../reducer/lambda";
import { ReducerFn, Value } from "../../value";
import { result } from "../../utility/result";
import * as core from "./core";

import { library as builtinLibrary } from "../../fr/builtin";
import { library as dictLibrary } from "../../fr/dict";
import { library as distLibrary } from "../../fr/dist";
import { library as dangerLibrary } from "../../fr/danger";
import { library as fnLibrary } from "../../fr/fn";
import { library as samplesetLibrary } from "../../fr/sampleset";
import { library as numberLibrary } from "../../fr/number";
import { library as pointsetLibrary } from "../../fr/pointset";
import { library as scoringLibrary } from "../../fr/scoring";
import { library as genericDistLibrary } from "../../fr/genericDist";
import { library as unitsLibrary } from "../../fr/units";
import { library as dateLibrary } from "../../fr/date";
import { library as mathLibrary } from "../../fr/math";
import { library as listLibrary } from "../../fr/list";
import { library as plotLibrary } from "../../fr/plot";
import { mxLambda } from "../../fr/mixture";
import { ErrorMessage } from "../../reducer/ErrorMessage";

const fnList: core.FRFunction[] = [
  ...builtinLibrary,
  ...dictLibrary,
  ...distLibrary,
  ...dangerLibrary,
  ...fnLibrary,
  ...samplesetLibrary,
  ...numberLibrary,
  ...pointsetLibrary,
  ...scoringLibrary,
  ...genericDistLibrary,
  ...unitsLibrary,
  ...dateLibrary,
  ...mathLibrary,
  ...listLibrary,
  ...plotLibrary,
];

export const registry = core.make(fnList);
export const call = (
  fnName: string,
  args: Value[],
  context: ReducerContext,
  reducer: ReducerFn
): result<Value, ErrorMessage> => {
  return core.call(registry, fnName, args, context, reducer);
};

export const allNames = () => core.allNames(registry);

export const nonRegistryLambdas: [string, Lambda][] = [
  ["mx", mxLambda],
  ["mixture", mxLambda],
];
