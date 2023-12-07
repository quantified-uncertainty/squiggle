import { REArgumentError, REOther } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frBool,
  frBoxed,
  frDict,
  frDist,
  frDistOrNumber,
  frLambdaTyped,
  frNumber,
  frOptional,
  frPlot,
  frSampleSetDist,
  frScale,
  frString,
} from "../library/registry/frTypes.js";
import {
  FnFactory,
  parseDistFromDistOrNumber,
} from "../library/registry/helpers.js";
import { Lambda } from "../reducer/lambda.js";
import { LabeledDistribution, Plot, Scale, VDomain } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Plot",
  requiresNamespace: true,
});

const defaultScale = { type: "linear" } satisfies Scale;

export function assertValidMinMax(scale: Scale) {
  const hasMin = scale.min !== undefined;
  const hasMax = scale.max !== undefined;

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
      `Unreachable: extractDomainFromOneArgFunction() called with function that doesn't have exactly one parameter.`
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

const numericFnDef = () => {
  const toPlot = (
    fn: Lambda,
    xScale: Scale | null,
    yScale: Scale | null,
    title: string | null,
    points: number | null
  ): Plot => {
    _assertYScaleNotDateScale(yScale);
    const domain = extractDomainFromOneArgFunction(fn);
    return {
      type: "numericFn",
      fn,
      xScale: createScale(xScale, domain),
      yScale: yScale ?? defaultScale,
      points: points ?? undefined,
      title: title ?? undefined,
    };
  };

  const fnType = frLambdaTyped([frNumber], frNumber);

  return maker.make({
    name: "numericFn",
    output: "Plot",
    examples: [
      `Plot.numericFn({ fn: {|x|x*x}, xScale: Scale.linear({ min: 3, max: 5 }), yScale: Scale.log({ tickFormat: ".2s" }) })`,
    ],
    definitions: [
      makeDefinition([frBoxed(fnType)], frPlot, ([[boxedArgs, fn]]) =>
        toPlot(fn, null, defaultScale, boxedArgs.name || null, null)
      ),
      //Maybe we should deprecate this eventually? I think I like the others more, especially for boxed functions and composition.
      makeDefinition(
        [
          frDict(
            ["fn", fnType],
            ["xScale", frOptional(frScale)],
            ["yScale", frOptional(frScale)],
            ["title", frOptional(frString)],
            ["points", frOptional(frNumber)]
          ),
        ],
        frPlot,
        ([{ fn, xScale, yScale, title, points }]) =>
          toPlot(fn, xScale, yScale, title, points)
      ),
    ],
  });
};

export const library = [
  maker.make({
    name: "dists",
    output: "Plot",
    examples: [
      `Plot.dists({
  dists: [{ name: "dist", value: normal(0, 1) }],
  xScale: Scale.symlog()
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
        frPlot,
        ([{ dists, xScale, yScale, title, showSummary }]) => {
          _assertYScaleNotDateScale(yScale);

          const distributions: LabeledDistribution[] = [];
          dists.forEach(({ name, value }) => {
            distributions.push({
              name,
              distribution: parseDistFromDistOrNumber(value),
            });
          });
          return {
            type: "distributions",
            distributions,
            xScale: xScale ?? defaultScale,
            yScale: yScale ?? defaultScale,
            title: title ?? undefined,
            showSummary: showSummary ?? true,
          };
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
  xScale: Scale.symlog()
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
        frPlot,
        ([{ dist, xScale, yScale, title, showSummary }]) => {
          _assertYScaleNotDateScale(yScale);
          return {
            type: "distributions",
            distributions: [{ distribution: dist }],
            xScale: xScale ?? defaultScale,
            yScale: yScale ?? defaultScale,
            title: title ?? undefined,
            showSummary: showSummary ?? true,
          };
        }
      ),
      makeDefinition([frBoxed(frDist)], frPlot, ([[args, dist]]) => {
        return {
          type: "distributions",
          distributions: [{ distribution: dist }],
          xScale: defaultScale,
          yScale: defaultScale,
          title: args.name ?? undefined,
          showSummary: false,
        };
      }),
    ],
  }),
  numericFnDef(),
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
            ["fn", frLambdaTyped([frNumber], frDist)],
            ["xScale", frOptional(frScale)],
            ["yScale", frOptional(frScale)],
            ["distXScale", frOptional(frScale)],
            ["title", frOptional(frString)],
            ["points", frOptional(frNumber)]
          ),
        ],
        frPlot,
        ([{ fn, xScale, yScale, distXScale, title, points }]) => {
          _assertYScaleNotDateScale(yScale);
          const domain = extractDomainFromOneArgFunction(fn);
          return {
            type: "distFn",
            fn,
            xScale: createScale(xScale, domain),
            yScale: yScale ?? defaultScale,
            distXScale: distXScale ?? yScale ?? defaultScale,
            title: title ?? undefined,
            points: points ?? undefined,
          };
        }
      ),
      makeDefinition(
        [frBoxed(frLambdaTyped([frNumber], frDist))],
        frPlot,
        ([[args, fn]]) => {
          const domain = extractDomainFromOneArgFunction(fn);
          return {
            type: "distFn",
            fn: fn,
            xScale: createScale(null, domain),
            yScale: defaultScale,
            distXScale: defaultScale,
            title: args.name || undefined,
            points: undefined,
          };
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
            ["xDist", frSampleSetDist],
            ["yDist", frSampleSetDist],
            ["xScale", frOptional(frScale)],
            ["yScale", frOptional(frScale)],
            ["title", frOptional(frString)]
          ),
        ],
        frPlot,
        ([{ xDist, yDist, xScale, yScale, title }]) => {
          _assertYScaleNotDateScale(yScale);
          return {
            type: "scatter",
            xDist,
            yDist,
            xScale: xScale ?? defaultScale,
            yScale: yScale ?? defaultScale,
            title: title ?? undefined,
          };
        }
      ),
    ],
  }),
];
