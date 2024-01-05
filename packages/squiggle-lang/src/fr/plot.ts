import mergeWith from "lodash/mergeWith.js";

import { REArgumentError, REOther } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frBool,
  frDict,
  frDist,
  frDistOrNumber,
  frLambdaTyped,
  frNamed,
  frNumber,
  frOptional,
  frOr,
  frPlot,
  frSampleSetDist,
  frScale,
  frString,
  frWithTags,
} from "../library/registry/frTypes.js";
import {
  FnFactory,
  parseDistFromDistOrNumber,
} from "../library/registry/helpers.js";
import { Lambda } from "../reducer/lambda.js";
import { clamp, sort, uniq } from "../utility/E_A_Floats.js";
import { LabeledDistribution, Plot, Scale, VDomain } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Plot",
  requiresNamespace: true,
});

const defaultScale = { method: { type: "linear" } } satisfies Scale;

const defaultScaleWithName = (name: string | undefined): Scale => {
  if (name) {
    return { ...defaultScale, title: name };
  } else {
    return defaultScale;
  }
};

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

  // _defaultScale can have a lot of undefined values. These should be over-written.
  const resultScale = mergeWith(
    {},
    scale || {},
    _defaultScale,
    (scaleValue, defaultValue) => scaleValue ?? defaultValue
  );

  return resultScale;
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
  if (yScale && yScale.method?.type === "date") {
    throw new REArgumentError(
      "Using a date scale as the plot yScale is not yet supported."
    );
  }
};

function formatXPoints(
  xPoints: readonly number[] | null,
  xScale: Scale | null
) {
  const points = xPoints
    ? sort(
        uniq(
          clamp(xPoints, {
            min: xScale?.min || undefined,
            max: xScale?.max || undefined,
          })
        )
      )
    : null;

  if (points === null) {
    return null;
  }

  if (points.length > 10000) {
    throw new REArgumentError(
      "xPoints must have under 10001 unique elements, within the provided xScale"
    );
  }

  return points;
}

const numericFnDef = () => {
  const toPlot = (
    fn: Lambda,
    xScale: Scale | null,
    yScale: Scale | null,
    title: string | null,
    xPoints: number[] | null
  ): Plot => {
    _assertYScaleNotDateScale(yScale);
    const domain = extractDomainFromOneArgFunction(fn);
    return {
      type: "numericFn",
      fn,
      xScale: createScale(xScale, domain),
      yScale: yScale ?? defaultScale,
      title: title ?? undefined,
      xPoints: xPoints ?? undefined,
    };
  };

  const fnType = frLambdaTyped([frNumber], frNumber);

  return maker.make({
    name: "numericFn",
    output: "Plot",
    interactiveExamples: [
      `Plot.numericFn(
  {|t|t ^ 2},
  { xScale: Scale.log({ min: 1, max: 100 }), points: 10 }
)`,
    ],
    definitions: [
      makeDefinition(
        [
          frNamed("fn", frWithTags(fnType)),
          frNamed(
            "params",
            frOptional(
              frDict(
                ["xScale", frOptional(frScale)],
                ["yScale", frOptional(frScale)],
                ["title", frOptional(frString)],
                ["xPoints", frOptional(frArray(frNumber))]
              )
            )
          ),
        ],
        frPlot,
        ([{ value, tags }, params]) => {
          const { xScale, yScale, title, xPoints } = params ?? {};
          return toPlot(
            value,
            xScale || null,
            yScale || null,
            title || tags.name() || null,
            formatXPoints(xPoints || null, xScale || null)
          );
        }
      ),
      makeDefinition(
        [
          frDict(
            ["fn", fnType],
            ["xScale", frOptional(frScale)],
            ["yScale", frOptional(frScale)],
            ["title", frOptional(frString)],
            ["xPoints", frOptional(frArray(frNumber))]
          ),
        ],
        frPlot,
        ([{ fn, xScale, yScale, title, xPoints }]) => {
          return toPlot(
            fn,
            xScale,
            yScale,
            title,
            formatXPoints(xPoints, xScale)
          );
        },
        { deprecated: "0.8.7" }
      ),
    ],
  });
};

export const library = [
  maker.make({
    name: "dists",
    output: "Plot",
    interactiveExamples: [
      `Plot.distFn(
  {|t|normal(t, 2) * normal(5, 3)},
  {
    title: "A Function of Value over Time",
    xScale: Scale.log({ min: 3, max: 100, title: "Time (years)" }),
    yScale: Scale.linear({ title: "Value" }),
    distXScale: Scale.linear({ tickFormat: "#x" }),
  }
)`,
    ],
    definitions: [
      makeDefinition(
        [
          frNamed(
            "dists",
            frOr(
              frArray(frDistOrNumber),
              frArray(
                frDict(
                  ["name", frOptional(frString)],
                  ["value", frDistOrNumber]
                )
              )
            )
          ),
          frOptional(
            frDict(
              ["xScale", frOptional(frScale)],
              ["yScale", frOptional(frScale)],
              ["title", frOptional(frString)],
              ["showSummary", frOptional(frBool)]
            )
          ),
        ],
        frPlot,
        ([dists, params]) => {
          const { xScale, yScale, title, showSummary } = params ?? {};
          yScale && _assertYScaleNotDateScale(yScale);
          const distributions: LabeledDistribution[] = [];
          if (dists.tag === "2") {
            dists.value.forEach(({ name, value }, index) => {
              distributions.push({
                name: name || `dist ${index + 1}`,
                distribution: parseDistFromDistOrNumber(value),
              });
            });
          } else {
            dists.value.forEach((dist, index) => {
              distributions.push({
                name: `dist ${index + 1}`,
                distribution: parseDistFromDistOrNumber(dist),
              });
            });
          }
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
        },
        { deprecated: "0.8.7" }
      ),
    ],
  }),
  maker.make({
    name: "dist",
    output: "Plot",
    examples: [
      `Plot.dist(normal(0,1), {
  xScale: Scale.symlog()
})`,
    ],
    interactiveExamples: [
      `Plot.dist(
  normal(5, 2),
  {
    xScale: Scale.linear({ min: -2, max: 6, title: "X Axis Title" }),
    title: "A Simple Normal Distribution",
    showSummary: true,
  }
)`,
    ],

    definitions: [
      makeDefinition(
        [
          frNamed("dist", frDist),
          frNamed(
            "params",
            frOptional(
              frDict(
                ["xScale", frOptional(frScale)],
                ["yScale", frOptional(frScale)],
                ["title", frOptional(frString)],
                ["showSummary", frOptional(frBool)]
              )
            )
          ),
        ],
        frPlot,
        ([dist, params]) => {
          const { xScale, yScale, title, showSummary } = params ?? {};
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
        },
        { deprecated: "0.8.7" }
      ),
    ],
  }),
  numericFnDef(),
  maker.make({
    name: "distFn",
    output: "Plot",
    interactiveExamples: [
      `Plot.distFn(
  {|t|normal(t, 2) * normal(5, 3)},
  {
    title: "A Function of Value over Time",
    xScale: Scale.log({ min: 3, max: 100, title: "Time (years)" }),
    yScale: Scale.linear({ title: "Value" }),
    distXScale: Scale.linear({ tickFormat: "#x" }),
  }
)`,
    ],
    definitions: [
      makeDefinition(
        [
          frNamed("fn", frWithTags(frLambdaTyped([frNumber], frDist))),
          frNamed(
            "params",
            frOptional(
              frDict(
                ["xScale", frOptional(frScale)],
                ["yScale", frOptional(frScale)],
                ["distXScale", frOptional(frScale)],
                ["title", frOptional(frString)],
                ["xPoints", frOptional(frArray(frNumber))]
              )
            )
          ),
        ],
        frPlot,
        ([{ value, tags }, params]) => {
          const domain = extractDomainFromOneArgFunction(value);
          const { xScale, yScale, distXScale, title, xPoints } = params ?? {};
          yScale && _assertYScaleNotDateScale(yScale);
          const _xScale = createScale(xScale || null, domain);
          return {
            fn: value,
            type: "distFn",
            xScale: _xScale,
            yScale: yScale ?? defaultScale,
            distXScale: distXScale ?? yScale ?? defaultScale,
            title: title ?? tags.name() ?? undefined,
            points: formatXPoints(xPoints || null, _xScale) ?? undefined,
          };
        }
      ),
      makeDefinition(
        [
          frDict(
            ["fn", frLambdaTyped([frNumber], frDist)],
            ["xScale", frOptional(frScale)],
            ["yScale", frOptional(frScale)],
            ["distXScale", frOptional(frScale)],
            ["title", frOptional(frString)],
            ["xPoints", frOptional(frArray(frNumber))]
          ),
        ],
        frPlot,
        ([{ fn, xScale, yScale, distXScale, title, xPoints }]) => {
          _assertYScaleNotDateScale(yScale);
          const domain = extractDomainFromOneArgFunction(fn);
          const _xScale = createScale(xScale, domain);
          return {
            type: "distFn",
            fn,
            xScale: _xScale,
            yScale: yScale ?? defaultScale,
            distXScale: distXScale ?? yScale ?? defaultScale,
            title: title ?? undefined,
            xPoints: formatXPoints(xPoints, _xScale) || undefined,
          };
        },
        { deprecated: "0.8.7" }
      ),
    ],
  }),
  maker.make({
    name: "scatter",
    output: "Plot",
    examples: [
      `Plot.scatter(
  {
    xDist: 2 to 5,
    yDist: SampleSet.fromDist(1 to 3),
    xScale: Scale.symlog(),
    yScale: Scale.symlog(),
  }
)`,
    ],
    interactiveExamples: [
      `xDist = SampleSet.fromDist(2 to 5)
yDist = normal({p5:-3, p95:3}) * 5 - xDist ^ 2
Plot.scatter({
  xDist: xDist,
  yDist: yDist,
  xScale: Scale.log({min: 1.5}),
})`,
      `xDist = SampleSet.fromDist(normal({p5:-2, p95:5}))
yDist = normal({p5:-3, p95:3}) * 5 - xDist
Plot.scatter({
  title: "A Scatterplot",
  xDist: xDist,
  yDist: yDist,
  xScale: Scale.symlog({title: "X Axis Title"}),
  yScale: Scale.symlog({title: "Y Axis Title"}),
})`,
    ],
    definitions: [
      makeDefinition(
        [
          frDict(
            ["xDist", frWithTags(frSampleSetDist)],
            ["yDist", frWithTags(frSampleSetDist)],
            ["xScale", frOptional(frScale)],
            ["yScale", frOptional(frScale)],
            ["title", frOptional(frString)]
          ),
        ],
        frPlot,
        ([{ xDist, yDist, xScale, yScale, title }]) => {
          _assertYScaleNotDateScale(yScale);
          const xTitle = xDist.tags.name();
          const yTitle = yDist.tags.name();
          return {
            type: "scatter",
            xDist: xDist.value,
            yDist: yDist.value,
            xScale: xScale ?? defaultScaleWithName(xTitle),
            yScale: yScale ?? defaultScaleWithName(yTitle),
            title: title ?? undefined,
          };
        }
      ),
    ],
  }),
];
