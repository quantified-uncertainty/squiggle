import { LocationRange } from "peggy";
import { expressionFromAst } from "../ast/toExpression.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frLambda,
  frRecord,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { Bindings, NamespaceMap } from "../reducer/bindings.js";
import { SquiggleLambda } from "../reducer/lambda.js";
import * as Result from "../utility/result.js";
import { vLambda, vNumber, vPlot, vString } from "../value/index.js";
import { IError } from "../reducer/IError.js";
import { parse } from "../ast/parse.js";

const maker = new FnFactory({
  nameSpace: "RelativeValues",
  requiresNamespace: true,
});

const relativeValuesShape = frRecord(
  ["ids", frArray(frString)],
  ["fn", frLambda]
);

export const library = [
  maker.make({
    name: "wrap",
    output: "Record",
    examples: [
      "RelativeValues.wrap({|id1, id2| [2 to 5, 3 to 6]})('foo', 'bar')",
    ],
    definitions: [
      // TODO - this is proof-of-concept and needs to be rewritten as `makeSquiggleDefinition` or as an implicitly imported Prelude.squiggle file
      makeDefinition("wrap", [frLambda], ([fn], context, reducer) => {
        const astResult = parse(
          `
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
`,
          "@stdlib"
        );
        if (!astResult.ok) {
          return Result.Error({
            type: "RESyntaxError",
            desc: astResult.value.message,
          });
        }
        const lambda = new SquiggleLambda(
          "RelativeValues.wrap",
          ["fn"],
          context.bindings,
          expressionFromAst(astResult.value),
          astResult.value.location
        );
        const result = lambda.call([vLambda(fn)], context, reducer);
        return Result.Ok(result);
      }),
    ],
  }),
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
      makeDefinition("gridPlot", [relativeValuesShape], ([{ ids, fn }]) => {
        return Result.Ok(
          vPlot({
            type: "relativeValues",
            fn,
            ids,
          })
        );
      }),
    ],
  }),
];
