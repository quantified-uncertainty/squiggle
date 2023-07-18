import { Lambda } from "../../reducer/lambda.js";
import { FRFunction, Registry } from "./core.js";

import { library as builtinLibrary } from "../../fr/builtin.js";
import { library as dangerLibrary } from "../../fr/danger.js";
import { library as dateLibrary } from "../../fr/date.js";
import { library as dictLibrary } from "../../fr/dict.js";
import { library as distLibrary } from "../../fr/dist.js";
import { library as fnLibrary } from "../../fr/fn.js";
import { library as genericDistLibrary } from "../../fr/genericDist.js";
import { library as listLibrary } from "../../fr/list.js";
import { library as mathLibrary } from "../../fr/math.js";
import { library as numberLibrary } from "../../fr/number.js";
import { library as plotLibrary } from "../../fr/plot.js";
import { library as tableLibrary } from "../../fr/table.js";
import { library as pointsetLibrary } from "../../fr/pointset.js";
import {
  makeSquiggleDefinitions as makeRelativeValuesSquiggleDefinitions,
  library as relativeValuesLibrary,
} from "../../fr/relativeValues.js";
import { library as samplesetLibrary } from "../../fr/sampleset.js";
import { library as scaleLibrary } from "../../fr/scale.js";
import { library as scoringLibrary } from "../../fr/scoring.js";
import { library as unitsLibrary } from "../../fr/units.js";

import { mxLambda } from "../../fr/mixture.js";
import { Bindings } from "../../reducer/stack.js";
import { ImmutableMap } from "../../utility/immutableMap.js";

const fnList: FRFunction[] = [
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
  ...tableLibrary,
  ...dateLibrary,
  ...mathLibrary,
  ...listLibrary,
  ...plotLibrary,
  ...scaleLibrary,
  ...relativeValuesLibrary,
];

export const registry = Registry.make(fnList);

export const nonRegistryLambdas: [string, Lambda][] = [
  ["mx", mxLambda],
  ["mixture", mxLambda],
];

export function makeSquiggleBindings(builtins: Bindings): Bindings {
  let squiggleBindings: Bindings = ImmutableMap();
  for (const makeDefinitions of [makeRelativeValuesSquiggleDefinitions]) {
    const squiggleDefinitions = makeDefinitions(builtins);
    for (const definition of squiggleDefinitions) {
      squiggleBindings = squiggleBindings.set(
        definition.name,
        definition.value
      );
    }
  }
  return squiggleBindings;
}
