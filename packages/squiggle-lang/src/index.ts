import { Env } from "./dist/env.js";
import { SqProject } from "./public/SqProject/index.js";
import {
  SqLambdaValue,
  SqNumberValue,
  SqStringValue,
  SqValue,
} from "./public/SqValue/index.js"; // TODO - reexport other values too

export {
  SqCompileError,
  SqError,
  SqFrame,
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
  SqDistribution,
  SqDistributionTag,
  SqPointSetDistribution,
  SqSampleSetDistribution,
  SqSymbolicDistribution,
} from "./public/SqValue/SqDistribution/index.js";
export { SqDomain } from "./public/SqValue/SqDomain.js";
export { SqLambda } from "./public/SqValue/SqLambda.js";
export {
  SqDistFnPlot,
  SqDistributionsPlot,
  SqNumericFnPlot,
  SqPlot,
  SqRelativeValuesPlot,
  SqScatterPlot,
} from "./public/SqValue/SqPlot.js";
export { SqRecord } from "./public/SqValue/SqRecord.js";
export {
  SqLinearScale,
  SqLogScale,
  SqPowerScale,
  SqScale,
  SqSymlogScale,
} from "./public/SqValue/SqScale.js";
export { SqValuePath } from "./public/SqValuePath.js";
export { parse } from "./public/parse.js";
export { fmap as resultMap, type result } from "./utility/result.js";

export { LocationRange as SqLocation } from "peggy";
export { defaultEnv as defaultEnvironment } from "./dist/env.js";
export { Env, SqLambdaValue, SqNumberValue, SqProject, SqStringValue, SqValue };

export { AST, ASTNode } from "./ast/parse.js";
export { ASTCommentNode } from "./ast/peggyHelpers.js";

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
