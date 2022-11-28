import { Env } from "../Dist/env";
import { SqProject } from "./SqProject";
import { SqValue } from "./SqValue";

export { SqValueLocation } from "./SqValueLocation";
export { result, fmap as resultMap } from "../utility/result";
export { SqDistribution, SqDistributionTag } from "./SqDistribution";
export { SqDistributionError } from "./SqDistributionError";
export { SqRecord } from "./SqRecord";
export { SqLambda } from "./SqLambda";
export { SqError, SqFrame } from "./SqError";
export { SqShape } from "./SqPointSet";
export { parse } from "./parse";

export { defaultEnv as defaultEnvironment } from "../Dist/env";
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
