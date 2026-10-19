import {
  result,
  run,
  SqLambda,
  SqStringValue,
  SqValue,
} from "@quri/squiggle-lang";

import { Item } from "../types.js";
import type { ModelEvaluator } from "./ModelEvaluator.js";

// Charts of one pair for the list view sidebar: the ratio distribution, a
// normalized scatter plot and both distributions.
//
// The helper is a fixed Squiggle function, compiled once (like
// `pairFromValues`), that is called with the pair's values from the
// evaluator. It never appends code to the user's model, so models with
// numbers as values or with a trailing result expression work, and its
// errors never point into the user's file.
const helperCode = `
export pairCharts(a, b, nameA, nameB) = {
  valueA = Dist(a)
  valueB = Dist(b)
  medianB = abs(median(valueB))
  {
    ratio: Tag.name(
      Plot.dist(
        {
          dist: valueA / valueB,
          xScale: Scale.symlog(),
          yScale: Scale.symlog(),
          showSummary: false,
        }
      ),
      "Ratio distribution"
    ),
    scatter: Tag.name(
      Plot.scatter(
        {
          xDist: SampleSet(valueB / medianB),
          yDist: SampleSet(valueA / medianB),
          xScale: Scale.symlog({ title: nameB }),
          yScale: Scale.symlog({ title: nameA }),
        }
      ),
      "Normalized scatter plot"
    ),
    distributions: Tag.name(
      [
        Tag.name(Plot.dist(valueA, { xScale: Scale.symlog() }), nameA),
        Tag.name(Plot.dist(valueB, { xScale: Scale.symlog() }), nameB),
      ],
      "Distributions"
    ),
  }
}
`;

const HELPER_LABEL = "Chart helper";

let helperPromise: Promise<SqLambda> | undefined;

function getHelper(): Promise<SqLambda> {
  helperPromise ??= (async () => {
    const output = await run(helperCode);
    const bindings = output.getBindings();
    if (!bindings.ok) {
      throw new Error(
        `${HELPER_LABEL} failed to compile: ${bindings.value.toString()}`
      );
    }
    const helper = bindings.value.get("pairCharts");
    if (helper?.tag !== "Lambda") {
      throw new Error(`${HELPER_LABEL} is not a function`);
    }
    return helper.value;
  })();
  return helperPromise;
}

/**
 * Charts for the value of `numerator` in terms of `denominator`, as a Squiggle
 * dict (`ratio`, `scatter`, `distributions`). Errors are short messages:
 * "Comparison failed: …" for the model's comparison function, "Chart helper:
 * …" for the charts themselves.
 */
export async function relativeValuesPairCharts(
  evaluator: ModelEvaluator,
  numerator: Item,
  denominator: Item
): Promise<result<SqValue, string>> {
  const environment = evaluator.environment;
  if (!evaluator.canCompute || !environment) {
    return {
      ok: false,
      value: "Charts aren't available for precomputed values",
    };
  }
  const pair = evaluator.comparePairValues(numerator.id, denominator.id);
  if (!pair.ok) {
    return { ok: false, value: `Comparison failed: ${pair.value}` };
  }
  const helper = await getHelper();
  const charts = helper.call(
    [
      pair.value[0],
      pair.value[1],
      SqStringValue.create(numerator.name),
      SqStringValue.create(denominator.name),
    ],
    environment
  );
  if (!charts.ok) {
    return { ok: false, value: `${HELPER_LABEL}: ${charts.value.toString()}` };
  }
  return { ok: true, value: charts.value };
}
