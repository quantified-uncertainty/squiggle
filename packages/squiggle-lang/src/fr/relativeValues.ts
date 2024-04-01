import { sq } from "../index.js";
import { makeFnExample } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frDeprecated,
  frDict,
  frLambdaTyped,
  frNumber,
  frOptional,
  frPlot,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { makeSquiggleDefinition } from "../library/registry/squiggleDefinition.js";
import { Bindings } from "../reducer/Stack.js";

const maker = new FnFactory({
  nameSpace: "RelativeValues",
  requiresNamespace: true,
});

const relativeValuesShape = frDict(
  ["ids", frArray(frString)],
  ["fn", frLambdaTyped([frString, frString], frArray(frNumber))],
  ["title", frDeprecated(frOptional(frString))]
);

export const library = [
  maker.make({
    name: "gridPlot",
    examples: [
      makeFnExample(
        `RelativeValues.gridPlot({
  ids: ["foo", "bar"],
  fn: {|id1, id2| [SampleSet.fromDist(2 to 5), SampleSet.fromDist(3 to 6)]},
})`,
        { isInteractive: true }
      ),
    ],
    definitions: [
      makeDefinition([relativeValuesShape], frPlot, ([{ ids, fn, title }]) => {
        return {
          type: "relativeValues",
          fn,
          ids,
          title: title ?? undefined,
        };
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
      absDist = SampleSet(dist) -> SampleSet.map(abs)
      p5 = inv(absDist, 0.05)
      p95 = inv(absDist, 0.95)
      log10(p95 / p5)
    }
    dists = fn(x,y)
    dist1 = SampleSet(dists[0])
    dist2 = SampleSet(dists[1])
    dist = Dist(dists[0] / dists[1])
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
