import { Env } from "./dist/env";
import { SqProject } from "./public/SqProject";
import { SqValue } from "./public/SqValue";

export { SqValueLocation } from "./public/SqValueLocation";
export { result, fmap as resultMap } from "./utility/result";
export { SqDistribution, SqDistributionTag } from "./public/SqDistribution";
export { SqDistributionError } from "./public/SqDistributionError";
export { SqRecord } from "./public/SqRecord";
export { SqLambda } from "./public/SqLambda";
export { SqError, SqFrame } from "./public/SqError";
export { SqShape } from "./public/SqPointSet";
export { SqPlot } from "./public/SqPlot";
export { SqParseError, parse } from "./public/parse";

export { defaultEnv as defaultEnvironment } from "./dist/env";
export { SqProject, SqValue };
export { Env };
export { LocationRange as SqLocation } from "peggy";

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
