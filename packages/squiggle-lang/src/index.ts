import { type Env } from "./dists/env.js";
import { registry } from "./library/registry/index.js";

export {
  SqDateValue,
  SqDictValue,
  SqDurationValue,
  SqLambdaValue,
  SqNumberValue,
  SqStringValue,
  type SqValue,
  SqVoidValue,
} from "./public/SqValue/index.js"; // TODO - reexport other values too

export { FnDefinition } from "./reducer/lambda/FnDefinition.js";

export { type FnDocumentation } from "./library/registry/core.js";
export {
  SqCheckboxInput,
  type SqInput,
  SqSelectInput,
  SqTextAreaInput,
  SqTextInput,
} from "./public/SqValue/SqInput.js";

export {
  SqCompileError,
  type SqError,
  SqFrame,
  SqImportError,
  SqOtherError,
  SqRuntimeError,
} from "./public/SqError.js";
export { SqDistributionError } from "./public/SqValue/SqDistribution/SqDistributionError.js";
export {
  type SqPointSet,
  type SqShape,
} from "./public/SqValue/SqDistribution/SqPointSet.js";
export {
  SqAbstractDistribution,
  type SqDistribution,
  SqDistributionTag,
  SqPointSetDistribution,
  SqSampleSetDistribution,
  SqSymbolicDistribution,
} from "./public/SqValue/SqDistribution/index.js";
export {
  SqDateRangeDomain,
  type SqDomain,
  SqNumericRangeDomain,
} from "./public/SqValue/SqDomain.js";
export { SqLambda, type SqLambdaParameter } from "./public/SqValue/SqLambda.js";
export {
  SqDistFnPlot,
  SqDistributionsPlot,
  SqNumericFnPlot,
  type SqPlot,
  SqRelativeValuesPlot,
  SqScatterPlot,
} from "./public/SqValue/SqPlot.js";
export { SqSpecification } from "./public/SqValue/SqSpecification.js";
export { SqTableChart } from "./public/SqValue/SqTableChart.js";
export { SqCalculator } from "./public/SqValue/SqCalculator.js";
export { SqDict } from "./public/SqValue/SqDict.js";
export { SqScale } from "./public/SqValue/SqScale.js";
export { SqValuePath, SqValuePathEdge } from "./public/SqValuePath.js";
export { parse } from "./public/parse.js";
export { fmap as resultMap, type result } from "./utility/result.js";

export {
  deserializeRunOutputFromBundle,
  deserializeRunResult,
  serializeRunOutputToStore,
  serializeRunResult,
} from "./runners/serialization.js";

export { squiggleCodec } from "./serialization/squiggle.js";

export { SDate } from "./utility/SDate.js";

export {
  type DurationUnitName,
  durationUnits,
  SDuration,
} from "./utility/SDuration.js";

export {
  type AST,
  type ASTCommentNode,
  type ASTNode,
  type LocationRange as SqLocation,
} from "./ast/types.js";
export { defaultEnv as defaultEnvironment } from "./dists/env.js";
export { type Env };

export { makeSelfContainedLinker, type SqLinker } from "./public/SqLinker.js";
export { SqProject } from "./public/SqProject/index.js";
export { SqModule } from "./public/SqProject/SqModule.js";
export { SqModuleOutput } from "./public/SqProject/SqModuleOutput.js";
export {
  type ProjectAction,
  type ProjectEventListener,
} from "./public/SqProject/types.js";

export { run } from "./run.js";

export { sq } from "./sq.js";

export function getFunctionDocumentation(name: string) {
  return registry.getFunctionDocumentation(name);
}

export function getAllFunctionNames() {
  return registry.allNames();
}

export function getAllFunctionNamesWithNamespace(name: string) {
  return registry
    .allFunctionsWithNamespace(name)
    .map((fn) => `${name}.${fn.name}`);
}

export {
  SCALE_POWER_DEFAULT_CONSTANT,
  SCALE_SYMLOG_DEFAULT_CONSTANT,
} from "./value/VScale.js";

export { generateSeed } from "./utility/seedGenerator.js";

export {
  allRunnerNames,
  defaultRunnerName,
  EmbeddedRunner,
  EmbeddedWithSerializationRunner,
  PoolRunner,
  runnerByName,
  type RunnerName,
  RunnerPool,
  WebWorkerRunner,
  WithCacheLoaderRunner,
} from "./runners/index.js";

export { BaseRunner } from "./runners/BaseRunner.js";

export { getStdLib } from "./library/index.js";
