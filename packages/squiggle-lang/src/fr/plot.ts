import mergeWith from "lodash/mergeWith.js";

import { ErrorMessage } from "../errors/messages.js";
import { frOptionalInput, namedInput } from "../library/FrInput.js";
import {
  frArray,
  frBool,
  frDict,
  frDist,
  frDistOrNumber,
  frNumber,
  frOr,
  frPlot,
  frSampleSetDist,
  frScale,
  frString,
  frTagged,
  frTypedLambda,
} from "../library/FrType.js";
import { makeFnExample } from "../library/registry/core.js";
import {
  FnFactory,
  parseDistFromDistOrNumber,
} from "../library/registry/helpers.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";
import { Lambda } from "../reducer/lambda/index.js";
import { TDateRange } from "../types/TDateRange.js";
import { tDist } from "../types/TDist.js";
import { tNumber } from "../types/TIntrinsic.js";
import { TNumberRange } from "../types/TNumberRange.js";
import { Type } from "../types/Type.js";
import { clamp, sort, uniq } from "../utility/E_A_Floats.js";
import { LabeledDistribution, Plot } from "../value/VPlot.js";
import { Scale } from "../value/VScale.js";

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
    throw ErrorMessage.argumentError(
      `Scale ${hasMin ? "min" : "max"} set without ${
        hasMin ? "max" : "min"
      }. Must set either both or neither.`
    );
  } else if (hasMin && hasMax && scale.min! >= scale.max!) {
    throw ErrorMessage.argumentError(
      `Scale min (${scale.min}) is greater or equal than than max (${scale.max})`
    );
  }
}

function createScale(scale: Scale | null, type: Type | undefined): Scale {
  /*
   * There are several possible combinations here:
   * 1. Scale with min/max -> ignore type, keep scale
   * 2. Scale without min/max, range type defined -> copy min/max from type
   * 3. Scale without min/max, no range type -> keep scale
   * 4. No scale and no range type -> default scale
   */
  //TODO: It might be good to check if scale is outside the bounds of the range type, and throw an error then or something.
  //TODO: It might also be good to check if the range type matches the scale type, and throw an error if not.

  scale && assertValidMinMax(scale);

  const _defaultScale =
    type && (type instanceof TNumberRange || type instanceof TDateRange)
      ? type.toDefaultScale()
      : defaultScale;

  // _defaultScale can have a lot of undefined values. These should be over-written.
  const resultScale = mergeWith(
    {},
    scale || {},
    _defaultScale,
    (scaleValue, defaultValue) => scaleValue ?? defaultValue
  );

  return resultScale;
}

// This function both extracts the parameter type and checks that the function has a single-parameter signature.
function extractTypeFromOneArgFunction(fn: Lambda): Type | undefined {
  const counts = fn.parameterCounts();
  if (!counts.includes(1)) {
    throw ErrorMessage.otherError(
      `Unreachable: extractFromOneArgFunction() called with function that doesn't have exactly one parameter.`
    );
  }

  if (fn.type === "UserDefinedLambda") {
    // We could also verify the domain here, to be more confident that the function expects numeric args.
    // But we might get other numeric domains besides `NumericRange`, so checking domain type here would be risky.
    return fn.signature.inputs[0]?.type;
  } else {
    // TODO - support builtin lambdas? but they never use range types yet
    return undefined;
  }
}

const _assertYScaleNotDateScale = (yScale: Scale | null) => {
  if (yScale && yScale.method?.type === "date") {
    throw ErrorMessage.argumentError(
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
    throw ErrorMessage.argumentError(
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
    const type = extractTypeFromOneArgFunction(fn);
    return {
      type: "numericFn",
      fn,
      xScale: createScale(xScale, type),
      yScale: yScale ?? defaultScale,
      title: title ?? undefined,
      xPoints: xPoints ?? undefined,
    };
  };

  const fnType = frTypedLambda([tNumber], tNumber);

  return maker.make({
    name: "numericFn",
    examples: [
      makeFnExample(
        `Plot.numericFn(
  {|t|t ^ 2},
  { xScale: Scale.log({ min: 1, max: 100 }), points: 10 }
)`,
        { isInteractive: true }
      ),
    ],
    definitions: [
      makeDefinition(
        [
          namedInput("fn", frTagged(fnType)),
          frOptionalInput({
            name: "params",
            type: frDict({
              xScale: { type: frScale, optional: true },
              yScale: { type: frScale, optional: true },
              title: {
                type: frString,
                optional: true,
                deprecated: true,
              },
              xPoints: { type: frArray(frNumber), optional: true },
            }),
          }),
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
          frDict({
            fn: fnType,
            xScale: { type: frScale, optional: true },
            yScale: { type: frScale, optional: true },
            title: { type: frString, optional: true, deprecated: true },
            xPoints: { type: frArray(frNumber), optional: true },
          }),
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
    examples: [
      makeFnExample(
        `Plot.dist(
  normal(5, 2),
  {
    xScale: Scale.linear({ min: -2, max: 6, title: "X Axis Title" }),
    showSummary: true,
  }
)`,
        { isInteractive: true }
      ),
    ],

    definitions: [
      makeDefinition(
        [
          namedInput("dist", frDist),
          frOptionalInput({
            name: "params",
            type: frDict({
              xScale: { type: frScale, optional: true },
              yScale: { type: frScale, optional: true },
              title: {
                type: frString,
                optional: true,
                deprecated: true,
              },
              showSummary: { type: frBool, optional: true },
            }),
          }),
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
          frDict({
            dist: frDist,
            xScale: { type: frScale, optional: true },
            yScale: { type: frScale, optional: true },
            title: {
              type: frString,
              optional: true,
              deprecated: true,
            },
            showSummary: { type: frBool, optional: true },
          }),
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
  maker.make({
    name: "dists",
    examples: [
      makeFnExample(
        `Plot.dists(
{
  dists: [
    { name: "First Dist", value: normal(0, 1) },
    { name: "Second Dist", value: uniform(2, 4) },
  ],
  xScale: Scale.symlog({ min: -2, max: 5 }),
}
)`,
        { isInteractive: true }
      ),
    ],
    definitions: [
      makeDefinition(
        [
          namedInput(
            "dists",
            frOr(
              frArray(frDistOrNumber),
              frArray(
                frDict({
                  name: { type: frString, optional: true },
                  value: frDistOrNumber,
                })
              )
            )
          ),
          frOptionalInput({
            type: frDict({
              xScale: { type: frScale, optional: true },
              yScale: { type: frScale, optional: true },
              title: { type: frString, optional: true, deprecated: true },
              showSummary: { type: frBool, optional: true },
            }),
          }),
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
          frDict({
            dists: frArray(frDict({ name: frString, value: frDistOrNumber })),
            xScale: { type: frScale, optional: true },
            yScale: { type: frScale, optional: true },
            title: {
              type: frString,
              optional: true,
              deprecated: true,
            },
            showSummary: { type: frBool, optional: true },
          }),
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
  numericFnDef(),
  maker.make({
    name: "distFn",
    examples: [
      makeFnExample(
        `Plot.distFn(
  {|t|normal(t, 2) * normal(5, 3)},
  {
    xScale: Scale.log({ min: 3, max: 100, title: "Time (years)" }),
    yScale: Scale.linear({ title: "Value" }),
    distXScale: Scale.linear({ tickFormat: "#x" }),
  }
)`,
        { isInteractive: true }
      ),
    ],
    definitions: [
      makeDefinition(
        [
          namedInput("fn", frTagged(frTypedLambda([tNumber], tDist))),
          frOptionalInput({
            name: "params",
            type: frDict({
              xScale: { type: frScale, optional: true },
              yScale: { type: frScale, optional: true },
              distXScale: { type: frScale, optional: true },
              title: {
                type: frString,
                optional: true,
                deprecated: true,
              },
              xPoints: { type: frArray(frNumber), optional: true },
            }),
          }),
        ],
        frPlot,
        ([{ value, tags }, params]) => {
          const domain = extractTypeFromOneArgFunction(value);
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
          frDict({
            fn: frTypedLambda([tNumber], tDist),
            distXScale: { type: frScale, optional: true },
            xScale: { type: frScale, optional: true },
            yScale: { type: frScale, optional: true },
            title: { type: frString, optional: true, deprecated: true },
            xPoints: { type: frArray(frNumber), optional: true },
          }),
        ],
        frPlot,
        ([{ fn, xScale, yScale, distXScale, title, xPoints }]) => {
          _assertYScaleNotDateScale(yScale);
          const domain = extractTypeFromOneArgFunction(fn);
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
    examples: [
      makeFnExample(
        `xDist = SampleSet.fromDist(2 to 5)
yDist = normal({p5:-3, p95:3}) * 5 - xDist ^ 2
Plot.scatter({
  xDist: xDist,
  yDist: yDist,
  xScale: Scale.log({min: 1.5}),
})`,
        { isInteractive: true }
      ),
      makeFnExample(
        `xDist = SampleSet.fromDist(normal({p5:-2, p95:5}))
yDist = normal({p5:-3, p95:3}) * 5 - xDist
Plot.scatter({
  xDist: xDist,
  yDist: yDist,
  xScale: Scale.symlog({title: "X Axis Title"}),
  yScale: Scale.symlog({title: "Y Axis Title"}),
})`,
        { isInteractive: true }
      ),
    ],
    definitions: [
      makeDefinition(
        [
          frDict({
            xDist: frTagged(frSampleSetDist),
            yDist: frTagged(frSampleSetDist),
            xScale: { type: frScale, optional: true },
            yScale: { type: frScale, optional: true },
            title: { type: frString, optional: true, deprecated: true },
          }),
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
