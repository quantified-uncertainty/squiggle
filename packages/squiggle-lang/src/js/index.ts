import { environment } from "../rescript/ForTS/ForTS__Types.gen";
import { SqProject } from "./SqProject";
import { SqValue, SqValueTag } from "./SqValue";
export { SqValueLocation } from "./SqValueLocation";
export { result } from "../rescript/ForTS/ForTS_Result_tag";
export { SqDistribution, SqDistributionTag } from "./SqDistribution";
export { SqDistributionError } from "./SqDistributionError";
export { SqRecord } from "./SqRecord";
export { SqLambda } from "./SqLambda";
export { SqProject };
export { SqValue, SqValueTag };
export {
  environment,
  defaultEnvironment,
} from "../rescript/ForTS/ForTS_Distribution/ForTS_Distribution.gen";
export { SqError, SqFrame, SqLocation } from "./SqError";
export { SqShape } from "./SqPointSetDist";
export { parse } from "./parse";

export { resultMap } from "./types";

export const run = (
  code: string,
  options?: {
    environment?: environment;
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
