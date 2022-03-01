import {runAll} from '../rescript/ProgramEvaluator.gen';
import type { Inputs_SamplingInputs_t as SamplingInputs } from '../rescript/ProgramEvaluator.gen';
export type { SamplingInputs } 
export type {t as DistPlus} from '../rescript/pointSetDist/DistPlus.gen';

export let defaultSamplingInputs : SamplingInputs = {
  sampleCount : 10000,
  outputXYPoints : 10000,
  pointDistLength : 1000
}

export function run(squiggleString : string, samplingInputs? : SamplingInputs) {
  let si : SamplingInputs = samplingInputs ? samplingInputs : defaultSamplingInputs
  return runAll(squiggleString, si)
}
