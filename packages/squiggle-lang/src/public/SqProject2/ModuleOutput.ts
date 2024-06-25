import { Env } from "../../dists/env.js";
import { ProjectItemOutputResult } from "../SqProject/ProjectItem.js";
import { ResolvedModule } from "./ResolvedModule.js";
import { getHash } from "./utils.js";

export class ModuleOutput {
  public module: ResolvedModule;
  public environment: Env;
  public output: ProjectItemOutputResult;

  constructor(params: {
    module: ResolvedModule;
    environment: Env;
    output: ProjectItemOutputResult;
  }) {
    this.module = params.module;
    this.environment = params.environment;
    this.output = params.output;
  }

  hash(): string {
    return ModuleOutput.hash({
      module: this.module,
      environment: this.environment,
    });
  }

  static hash(params: { module: ResolvedModule; environment: Env }): string {
    return (
      `output-${params.module.module.name}-` +
      getHash(
        JSON.stringify({
          module: params.module.hash(),
          environment: params.environment,
        })
      )
    );
  }
}
