import { sq } from "../index.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frLambda,
  frDict,
  frString,
  frOptional,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { makeSquiggleDefinition } from "../library/registry/squiggleDefinition.js";
import { Bindings } from "../reducer/stack.js";
import { vPlot } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "RelativeValues",
  requiresNamespace: true,
});

const relativeValuesShape = frDict(
  ["ids", frArray(frString)],
  ["fn", frLambda],
  ["title", frOptional(frString)]
);

export const library = [
  maker.make({
    name: "gridPlot",
    output: "Plot",
    examples: [
      `RelativeValues.gridPlot({
    ids: ["foo", "bar"],
    fn: {|id1, id2| [SampleSet.fromDist(2 to 5), SampleSet.fromDist(3 to 6)]},
  })`,
    ],
    definitions: [
      makeDefinition([relativeValuesShape], ([{ ids, fn, title }]) => {
        return vPlot({
          type: "relativeValues",
          fn,
          ids,
          title: title ?? undefined,
        });
      }),
    ],
  }),
];

export function makeSquiggleDefinitions(builtins: Bindings) {
  return [
    makeSquiggleDefinition({
      builtins,
      name: "RelativeValues.wrap",
      code: sq`
{ |fn|
  {
    |x,y|
    findUncertainty(dist) = {
      absDist = dist -> SampleSet.fromDist -> SampleSet.map(abs)
      p5 = inv(absDist, 0.05)
      p95 = inv(absDist, 0.95)
      log10(p95 / p5)
    }
    dists = fn(x,y)
    dist1 = dists[0] -> SampleSet.fromDist
    dist2 = dists[1] -> SampleSet.fromDist
    dist = dists[0] / dists[1]
    {
      median: inv(dist, 0.5),
      mean: mean(dist),
      min: inv(dist, 0.05),
      max: inv(dist, 0.95),
      uncertainty: findUncertainty(dist)
    }
  }
}`,
    }),
  ];
}
