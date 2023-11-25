import { REArgumentError, REOther } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frBool,
  frDict,
  frDist,
  frDistOrNumber,
  frLambda,
  frNumber,
  frOptional,
  frScale,
  frString,
} from "../library/registry/frTypes.js";
import {
  FnFactory,
  parseDistFromDistOrNumber,
} from "../library/registry/helpers.js";
import { Lambda } from "../reducer/lambda.js";
import { LabeledDistribution, Scale, VDomain, vPlot } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Plot",
  requiresNamespace: true,
});

const defaultScale = { type: "linear" } satisfies Scale;

export function assertValidMinMax(scale: Scale) {
  const hasMin = scale.min != undefined;
  const hasMax = scale.max != undefined;

  // Validate scale properties
  if (hasMin !== hasMax) {
    throw new REArgumentError(
      `Scale ${hasMin ? "min" : "max"} set without ${
        hasMin ? "max" : "min"
      }. Must set either both or neither.`
    );
  } else if (hasMin && hasMax && scale.min! >= scale.max!) {
    throw new REArgumentError(
      `Scale min (${scale.min}) is greater or equal than than max (${scale.max})`
    );
  }
}

function createScale(scale: Scale | null, domain: VDomain | undefined): Scale {
  /*
   * There are several possible combinations here:
   * 1. Scale with min/max -> ignore domain, keep scale
   * 2. Scale without min/max, domain defined -> copy min/max from domain
   * 3. Scale without min/max, no domain -> keep scale
   * 4. No scale and no domain -> default scale
   */
  //TODO: It might be good to check if scale is outside the bounds of the domain, and throw an error then or something.
  //TODO: It might also be good to check if the domain type matches the scale type, and throw an error if not.

  scale && assertValidMinMax(scale);

  const _defaultScale = domain ? domain.value.toDefaultScale() : defaultScale;

  // This gets min/max from domain, if it's not on scale.
  return {
    ..._defaultScale,
    ...(scale || {}),
  };
}

// This function both extract the domain and checks that the function has only one parameter.
function extractDomainFromOneArgFunction(fn: Lambda): VDomain | undefined {
  const counts = fn.parameterCounts();
  if (!counts.includes(1)) {
    throw new REOther(
      `Plots only work with functions that have one parameter. This function only supports ${fn.parameterCountString()} parameters.`
    );
  }

  let domain;
  if (fn.type === "UserDefinedLambda") {
    domain = fn.parameters[0]?.domain;
  } else {
    domain = undefined;
  }
  // We could also verify a domain here, to be more confident that the function expects numeric args.
  // But we might get other numeric domains besides `NumericRange`, so checking domain type here would be risky.
  return domain;
}

const _assertYScaleNotDateScale = (yScale: Scale | null) => {
  if (yScale && yScale.type === "date") {
    throw new REArgumentError(
      "Using a date scale as the plot yScale is not yet supported."
    );
  }
};

export const library = [
  maker.make({
    name: "dists",
    output: "Plot",
    examples: [
      `Plot.dists({
  dists: [{ name: "dist", value: normal(0, 1) }],
  xScale: Scale.symlog(),
})`,
    ],
    definitions: [
      makeDefinition(
        [
          frDict(
            [
              "dists",
              frArray(frDict(["name", frString], ["value", frDistOrNumber])),
            ],
            ["xScale", frOptional(frScale)],
            ["yScale", frOptional(frScale)],
            ["title", frOptional(frString)],
            ["showSummary", frOptional(frBool)]
          ),
        ],
        ([{ dists, xScale, yScale, title, showSummary }]) => {
          _assertYScaleNotDateScale(yScale);

          const distributions: LabeledDistribution[] = [];
          dists.forEach(({ name, value }) => {
            distributions.push({
              name,
              distribution: parseDistFromDistOrNumber(value),
            });
          });
          return vPlot({
            type: "distributions",
            distributions,
            xScale: xScale ?? defaultScale,
            yScale: yScale ?? defaultScale,
            title: title ?? undefined,
            showSummary: showSummary ?? true,
          });
        }
      ),
    ],
  }),
  maker.make({
    name: "dist",
    output: "Plot",
    examples: [
      `Plot.dist({
  dist: normal(0, 1),
  xScale: Scale.symlog(),
})`,
    ],
    definitions: [
      makeDefinition(
        [
          frDict(
            ["dist", frDist],
            ["xScale", frOptional(frScale)],
            ["yScale", frOptional(frScale)],
            ["title", frOptional(frString)],
            ["showSummary", frOptional(frBool)]
          ),
        ],
        ([{ dist, xScale, yScale, title, showSummary }]) => {
          _assertYScaleNotDateScale(yScale);
          return vPlot({
            type: "distributions",
            distributions: [{ distribution: dist }],
            xScale: xScale ?? defaultScale,
            yScale: yScale ?? defaultScale,
            title: title ?? undefined,
            showSummary: showSummary ?? true,
          });
        }
      ),
    ],
  }),
  maker.make({
    name: "numericFn",
    output: "Plot",
    examples: [
      `Plot.numericFn({ fn: {|x|x*x}, xScale: Scale.linear({ min: 3, max: 5 }), yScale: Scale.log({ tickFormat: ".2s" }) })`,
    ],
    definitions: [
      makeDefinition(
        [
          frDict(
            ["fn", frLambda],
            ["xScale", frOptional(frScale)],
            ["yScale", frOptional(frScale)],
            ["title", frOptional(frString)],
            ["points", frOptional(frNumber)]
          ),
        ],
        ([{ fn, xScale, yScale, title, points }]) => {
          _assertYScaleNotDateScale(yScale);
          const domain = extractDomainFromOneArgFunction(fn);
          return vPlot({
            type: "numericFn",
            fn,
            xScale: createScale(xScale, domain),
            yScale: yScale ?? defaultScale,
            points: points ?? undefined,
            title: title ?? undefined,
          });
        }
      ),
    ],
  }),
  maker.make({
    name: "distFn",
    output: "Plot",
    examples: [
      `Plot.distFn({ fn: {|x|uniform(x, x+1)}, xScale: Scale.linear({ min: 3, max: 5}), yScale: Scale.log({ tickFormat: ".2s" }) })`,
    ],
    definitions: [
      makeDefinition(
        [
          frDict(
            ["fn", frLambda],
            ["xScale", frOptional(frScale)],
            ["yScale", frOptional(frScale)],
            ["distXScale", frOptional(frScale)],
            ["title", frOptional(frString)],
            ["points", frOptional(frNumber)]
          ),
        ],
        ([{ fn, xScale, yScale, distXScale, title, points }]) => {
          _assertYScaleNotDateScale(yScale);
          const domain = extractDomainFromOneArgFunction(fn);
          return vPlot({
            type: "distFn",
            fn,
            xScale: createScale(xScale, domain),
            yScale: yScale ?? defaultScale,
            distXScale: distXScale ?? yScale ?? defaultScale,
            title: title ?? undefined,
            points: points ?? undefined,
          });
        }
      ),
    ],
  }),
  maker.make({
    name: "scatter",
    output: "Plot",
    examples: [
      `Plot.scatter({ xDist: 2 to 5, yDist: SampleSet.fromDist(1 to 3) })`,
      `Plot.scatter({ xDist: 2 to 5, yDist: SampleSet.fromDist(1 to 3), xScale: Scale.symlog(), yScale: Scale.symlog() })`,
    ],
    definitions: [
      makeDefinition(
        [
          frDict(
            ["xDist", frDist],
            ["yDist", frDist],
            ["xScale", frOptional(frScale)],
            ["yScale", frOptional(frScale)],
            ["title", frOptional(frString)]
          ),
        ],
        ([{ xDist, yDist, xScale, yScale, title }]) => {
          _assertYScaleNotDateScale(yScale);
          return vPlot({
            type: "scatter",
            xDist,
            yDist,
            xScale: xScale ?? defaultScale,
            yScale: yScale ?? defaultScale,
            title: title ?? undefined,
          });
        }
      ),
    ],
  }),
];
