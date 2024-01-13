import { REArgumentError } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frBool,
  frDeprecated,
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
  assertScaleNotDateScale,
  createScaleUsingDomain,
  extractDomainFromOneArgFunction,
  FnFactory,
  parseDistFromDistOrNumber,
} from "../library/registry/helpers.js";
import { Lambda } from "../reducer/lambda.js";
import { clamp, sort, uniq } from "../utility/E_A_Floats.js";
import { LabeledDistribution, Plot, Scale } from "../value/index.js";

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
    assertScaleNotDateScale(yScale);
    const domain = extractDomainFromOneArgFunction(fn);
    return {
      type: "numericFn",
      fn,
      xScale: createScaleUsingDomain(xScale, domain),
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
                ["title", frDeprecated(frOptional(frString))],
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
            ["title", frDeprecated(frOptional(frString))],
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
    name: "dist",
    output: "Plot",
    interactiveExamples: [
      `Plot.dist(
  normal(5, 2),
  {
    xScale: Scale.linear({ min: -2, max: 6, title: "X Axis Title" }),
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
                ["title", frDeprecated(frOptional(frString))],
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
            ["title", frDeprecated(frOptional(frString))],
            ["showSummary", frOptional(frBool)]
          ),
        ],
        frPlot,
        ([{ dist, xScale, yScale, title, showSummary }]) => {
          assertScaleNotDateScale(yScale);
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
  maker.make({
    name: "dists",
    output: "Plot",
    interactiveExamples: [
      `Plot.dists(
{
  dists: [
    { name: "First Dist", value: normal(0, 1) },
    { name: "Second Dist", value: uniform(2, 4) },
  ],
  xScale: Scale.symlog({ min: -2, max: 5 }),
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
              ["title", frDeprecated(frOptional(frString))],
              ["showSummary", frOptional(frBool)]
            )
          ),
        ],
        frPlot,
        ([dists, params]) => {
          const { xScale, yScale, title, showSummary } = params ?? {};
          yScale && assertScaleNotDateScale(yScale);
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
            ["title", frDeprecated(frOptional(frString))],
            ["showSummary", frOptional(frBool)]
          ),
        ],
        frPlot,
        ([{ dists, xScale, yScale, title, showSummary }]) => {
          assertScaleNotDateScale(yScale);

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
  numericFnDef(),
  maker.make({
    name: "distFn",
    output: "Plot",
    interactiveExamples: [
      `Plot.distFn(
  {|t|normal(t, 2) * normal(5, 3)},
  {
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
                ["title", frDeprecated(frOptional(frString))],
                ["xPoints", frOptional(frArray(frNumber))]
              )
            )
          ),
        ],
        frPlot,
        ([{ value, tags }, params]) => {
          const domain = extractDomainFromOneArgFunction(value);
          const { xScale, yScale, distXScale, title, xPoints } = params ?? {};
          yScale && assertScaleNotDateScale(yScale);
          const _xScale = createScaleUsingDomain(xScale || null, domain);
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
            ["title", frDeprecated(frOptional(frString))],
            ["xPoints", frOptional(frArray(frNumber))]
          ),
        ],
        frPlot,
        ([{ fn, xScale, yScale, distXScale, title, xPoints }]) => {
          assertScaleNotDateScale(yScale);
          const domain = extractDomainFromOneArgFunction(fn);
          const _xScale = createScaleUsingDomain(xScale, domain);
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
            ["title", frDeprecated(frOptional(frString))]
          ),
        ],
        frPlot,
        ([{ xDist, yDist, xScale, yScale, title }]) => {
          assertScaleNotDateScale(yScale);
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
