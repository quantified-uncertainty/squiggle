import { Env } from "./dist/env.js";
import { SqProject } from "./public/SqProject/index.js";
import { SqValue, SqStringValue } from "./public/SqValue.js"; // TODO - reexport other values too

export { SqValueLocation } from "./public/SqValueLocation.js";
export { result, fmap as resultMap } from "./utility/result.js";
export { SqDistribution, SqDistributionTag } from "./public/SqDistribution.js";
export { SqDistributionError } from "./public/SqDistributionError.js";
export { SqRecord } from "./public/SqRecord.js";
export { SqLambda } from "./public/SqLambda.js";
export { SqError, SqFrame } from "./public/SqError.js";
export { SqShape } from "./public/SqPointSet.js";
export { SqPlot, SqDistributionsPlot } from "./public/SqPlot.js";
export { SqParseError, parse } from "./public/parse.js";

export { defaultEnv as defaultEnvironment } from "./dist/env.js";
export { SqProject, SqValue, SqStringValue };
export { Env };
export { LocationRange as SqLocation } from "peggy";

export { AST } from "./ast/parse.js";

export const run = (
  code: string,
  options?: {
    environment?: Env;
  }
) => {
  const project = SqProject.create();
  project.setSource("main", code);
  if (options?.environment) {
    project.setEnvironment(options.environment);
  }
  project.run("main");
  const result = project.getResult("main");
  const bindings = project.getBindings("main");
  return { result, bindings };
};

// can be used for syntax highlighting in JS/TS files if you have Squiggle VS Code extension installed.
export function sq(strings: TemplateStringsArray, ...rest: unknown[]) {
  if (rest.length) {
    throw new Error("Extrapolation in sq`` template literals is forbidden");
  }
  return strings.join("");
}
