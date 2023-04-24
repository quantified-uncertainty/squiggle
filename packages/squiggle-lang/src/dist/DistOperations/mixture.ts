import * as E_A_Floats from "../../utility/E_A_Floats.js";
import * as Result from "../../utility/result.js";
import { result } from "../../utility/result.js";
import { BaseDist } from "../BaseDist.js";
import { DistError, otherError } from "../DistError.js";
import * as SampleSetDist from "../SampleSetDist/index.js";
import { Env } from "../env.js";
import {
  pointwiseCombination,
  pointwiseCombinationFloat,
} from "./pointwiseCombination.js";

//TODO: The result should always cumulatively sum to 1. This would be good to test.
//TODO: If the inputs are not normalized, this will return poor results. The weights probably refer to the post-normalized forms. It would be good to apply a catch to this.
export function mixture(
  values: [BaseDist, number][],
  { env }: { env: Env }
): result<BaseDist, DistError> {
  const scaleMultiplyFn = (dist: BaseDist, weight: number) =>
    pointwiseCombinationFloat(dist, {
      env,
      algebraicOperation: "Multiply",
      f: weight,
    });

  const pointwiseAddFn = (dist1: BaseDist, dist2: BaseDist) =>
    pointwiseCombination({
      t1: dist1,
      t2: dist2,
      env,
      algebraicOperation: "Add",
    });

  const allValuesAreSampleSet = (v: [BaseDist, number][]) =>
    v.every(([t]) => t instanceof SampleSetDist.SampleSetDist);

  if (values.length < 1) {
    return Result.Error(
      otherError("Mixture error: mixture must have at least 1 element")
    );
  } else if (allValuesAreSampleSet(values)) {
    const withSampleSetValues = values.map(([value, weight]) => {
      if (value instanceof SampleSetDist.SampleSetDist) {
        return [value, weight] as [SampleSetDist.SampleSetDist, number];
      } else {
        throw new Error(
          "Mixture coding error: SampleSet expected. This should be inaccessible."
        );
      }
    });
    return SampleSetDist.mixture(withSampleSetValues, env.sampleCount);
  } else {
    const totalWeight = E_A_Floats.sum(values.map(([, w]) => w));
    const properlyWeightedValues: BaseDist[] = [];
    for (const [dist, weight] of values) {
      const r = scaleMultiplyFn(dist, weight / totalWeight);
      if (!r.ok) {
        return r;
      }
      properlyWeightedValues.push(r.value);
    }

    let answer = properlyWeightedValues[0];
    for (const dist of properlyWeightedValues.slice(1)) {
      const r = pointwiseAddFn(answer, dist);
      if (!r.ok) {
        return r;
      }
      answer = r.value;
    }
    return Result.Ok(answer);
  }
}
