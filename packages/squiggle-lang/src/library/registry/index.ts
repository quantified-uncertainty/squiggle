import { Lambda } from "../../reducer/lambda.js";
import { Registry, FRFunction } from "./core.js";

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
import { library as pointsetLibrary } from "../../fr/pointset.js";
import { library as relativeValuesLibrary } from "../../fr/relativeValues.js";
import { library as samplesetLibrary } from "../../fr/sampleset.js";
import { library as scaleLibrary } from "../../fr/scale.js";
import { library as scoringLibrary } from "../../fr/scoring.js";
import { library as unitsLibrary } from "../../fr/units.js";

import { mxLambda } from "../../fr/mixture.js";

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
