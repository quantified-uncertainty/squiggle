import { type Env } from "./dist/env.js";
import { SqProject } from "./public/SqProject/index.js";
export {
  type SqInput,
  SqTextAreaInput,
  SqCheckboxInput,
  SqSelectInput,
  SqTextInput,
} from "./public/SqValue/SqInput.js";
import {
  SqLambdaValue,
  SqNumberValue,
  SqStringValue,
  type SqValue,
} from "./public/SqValue/index.js"; // TODO - reexport other values too

export {
  SqCompileError,
  SqFrame,
  SqOtherError,
  SqRuntimeError,
  type SqError,
} from "./public/SqError.js";
export { SqDistributionError } from "./public/SqValue/SqDistribution/SqDistributionError.js";
export {
  type SqPointSet,
  type SqShape,
} from "./public/SqValue/SqDistribution/SqPointSet.js";
export {
  SqAbstractDistribution,
  SqDistributionTag,
  SqPointSetDistribution,
  SqSampleSetDistribution,
  SqSymbolicDistribution,
  type SqDistribution,
} from "./public/SqValue/SqDistribution/index.js";
export { type SqDomain } from "./public/SqValue/SqDomain.js";
export { SqLambda, type SqLambdaParameter } from "./public/SqValue/SqLambda.js";
export { SqDictValue } from "./public/SqValue/index.js";
export {
  SqDistFnPlot,
  SqDistributionsPlot,
  SqNumericFnPlot,
  SqRelativeValuesPlot,
  SqScatterPlot,
  type SqPlot,
} from "./public/SqValue/SqPlot.js";
export { SqTableChart } from "./public/SqValue/SqTableChart.js";
export { SqCalculator } from "./public/SqValue/SqCalculator.js";
export { SqDict } from "./public/SqValue/SqDict.js";
export {
  SqLinearScale,
  SqLogScale,
  SqPowerScale,
  SqSymlogScale,
  type SqScale,
} from "./public/SqValue/SqScale.js";
export { type PathItem, SqValuePath } from "./public/SqValuePath.js";
export { parse } from "./public/parse.js";
export { fmap as resultMap, type result } from "./utility/result.js";

export { type LocationRange as SqLocation } from "peggy";
export { defaultEnv as defaultEnvironment } from "./dist/env.js";
export {
  SqLambdaValue,
  SqNumberValue,
  SqProject,
  SqStringValue,
  type Env,
  type SqValue,
};

export { type AST, type ASTNode } from "./ast/parse.js";
export { type ASTCommentNode } from "./ast/peggyHelpers.js";
export { type SqLinker } from "./public/SqLinker.js";

export async function run(
  code: string,
  options?: {
    environment?: Env;
  }
) {
  const project = SqProject.create();
  project.setSource("main", code);
  if (options?.environment) {
    project.setEnvironment(options.environment);
  }
  await project.run("main");
  return project.getOutput("main");
}

// can be used for syntax highlighting in JS/TS files if you have Squiggle VS Code extension installed.
export function sq(strings: TemplateStringsArray, ...rest: unknown[]) {
  if (rest.length) {
    throw new Error("Extrapolation in sq`` template literals is forbidden");
  }
  return strings.join("");
}
