import { library as booleanLibrary } from "../../fr/boolean.js";
import { library as calculatorLibrary } from "../../fr/calculator.js";
import { library as commonLibrary } from "../../fr/common.js";
import { library as dangerLibrary } from "../../fr/danger.js";
import { library as dateLibrary } from "../../fr/date.js";
import { library as dictLibrary } from "../../fr/dict.js";
import { library as distLibrary } from "../../fr/dist.js";
import { library as durationLibrary } from "../../fr/duration.js";
import { library as genericDistLibrary } from "../../fr/genericDist.js";
import { library as inputLibrary } from "../../fr/input.js";
import { library as listLibrary } from "../../fr/list.js";
import { library as mathLibrary } from "../../fr/math.js";
import { library as mixedSetLibrary } from "../../fr/mixedSet.js";
import { library as numberLibrary } from "../../fr/number.js";
import { library as plotLibrary } from "../../fr/plot.js";
import { library as pointsetLibrary } from "../../fr/pointset.js";
import {
  library as relativeValuesLibrary,
  makeSquiggleDefinitions as makeRelativeValuesSquiggleDefinitions,
} from "../../fr/relativeValues.js";
import { library as samplesetLibrary } from "../../fr/sampleset.js";
import { library as scaleLibrary } from "../../fr/scale.js";
import { library as scoringLibrary } from "../../fr/scoring.js";
import { library as specificationLibrary } from "../../fr/specification.js";
import { library as stringLibrary } from "../../fr/string.js";
import { library as symLibrary } from "../../fr/sym.js";
import { library as systemLibrary } from "../../fr/system.js";
import { library as tableLibrary } from "../../fr/table.js";
import { library as tagLibrary } from "../../fr/tag.js";
import { library as unitsLibrary } from "../../fr/units.js";
import { Bindings } from "../../reducer/Stack.js";
import { ImmutableMap } from "../../utility/immutable.js";
import { FRFunction, Registry } from "./core.js";

function makeRegistry() {
  const fnList: FRFunction[] = [
    ...booleanLibrary,
    ...dangerLibrary,
    ...dateLibrary,
    ...dictLibrary,
    ...durationLibrary,
    //It's important that numberLibrary comes before distLibrary, because we want Number.sum[] to be prioritized over Dist.sum[].
    ...numberLibrary,
    ...distLibrary,
    ...genericDistLibrary,
    ...tableLibrary,
    ...listLibrary,
    ...mathLibrary,
    ...tagLibrary,
    ...plotLibrary,
    ...pointsetLibrary,
    ...relativeValuesLibrary,
    ...stringLibrary,
    ...samplesetLibrary,
    ...scaleLibrary,
    ...scoringLibrary,
    ...mixedSetLibrary,
    ...symLibrary,
    ...unitsLibrary,
    ...calculatorLibrary,
    ...inputLibrary,
    ...specificationLibrary,
    ...systemLibrary,
    ...commonLibrary, // should go last, because has some catch-all functions
  ];
  return Registry.make(fnList);
}

// lazy cache
let cachedRegistry: Registry | undefined;
export function getRegistry(): Registry {
  cachedRegistry ??= makeRegistry();
  return cachedRegistry;
}

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
