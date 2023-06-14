import * as E_A_Floats from "../../utility/E_A_Floats.js";
import * as Result from "../../utility/result.js";
import { result } from "../../utility/result.js";
import { BaseDist } from "../BaseDist.js";
import { DistError, otherError } from "../DistError.js";
import * as SampleSetDist from "../SampleSetDist/index.js";
import { Env } from "../env.js";
import { binaryOperations } from "./binaryOperations.js";
import { scaleMultiply } from "./scaleOperations.js";

//TODO: The result should always cumulatively sum to 1. This would be good to test.
//TODO: If the inputs are not normalized, this will return poor results. The weights probably refer to the post-normalized forms. It would be good to apply a catch to this.
export function mixture(
  values: [BaseDist, number][],
  { env }: { env: Env }
): result<BaseDist, DistError> {
  if (values.length < 1) {
    return Result.Err(
      otherError("Mixture error: mixture must have at least 1 element")
    );
  }

  const someValuesAreSampleSets = values.some(
    ([t]) => t instanceof SampleSetDist.SampleSetDist
  );

  if (someValuesAreSampleSets) {
    const sampleSetValues: [SampleSetDist.SampleSetDist, number][] = [];
    for (const [dist, weight] of values) {
      if (dist instanceof SampleSetDist.SampleSetDist) {
        sampleSetValues.push([dist, weight]);
      } else {
        const sampleSetResult = SampleSetDist.SampleSetDist.fromDist(dist, env);
        if (!sampleSetResult.ok) {
          return sampleSetResult;
        }
        sampleSetValues.push([sampleSetResult.value, weight]);
      }
    }
    return SampleSetDist.mixture(sampleSetValues, env.sampleCount);
  }

  const totalWeight = E_A_Floats.sum(values.map(([, w]) => w));
  const properlyWeightedValues: BaseDist[] = [];
  for (const [dist, weight] of values) {
    const r = scaleMultiply(dist, weight / totalWeight, { env });
    if (!r.ok) {
      return r;
    }
    properlyWeightedValues.push(r.value);
  }

  let answer = properlyWeightedValues[0];
  for (const dist of properlyWeightedValues.slice(1)) {
    const r = binaryOperations.pointwiseAdd(answer, dist, { env });
    if (!r.ok) {
      return r;
    }
    answer = r.value;
  }
  return Result.Ok(answer);
}
