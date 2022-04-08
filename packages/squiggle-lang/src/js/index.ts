import {runAll} from '../rescript/ProgramEvaluator.gen';
import type { Inputs_SamplingInputs_t as SamplingInputs, exportEnv, exportType, exportDistribution} from '../rescript/ProgramEvaluator.gen';
export type { SamplingInputs, exportEnv, exportDistribution }
export type {t as DistPlus} from '../rescript/OldInterpreter/DistPlus.gen';

export let defaultSamplingInputs : SamplingInputs = {
  sampleCount : 10000,
  outputXYPoints : 10000,
  pointDistLength : 1000
}

export function run(squiggleString : string, samplingInputs? : SamplingInputs, environment?: exportEnv) : { tag: "Ok"; value: exportType }
  | { tag: "Error"; value: string } {
  let si : SamplingInputs = samplingInputs ? samplingInputs : defaultSamplingInputs
  let env : exportEnv = environment ? environment : []
  return runAll(squiggleString, si, env)
}
