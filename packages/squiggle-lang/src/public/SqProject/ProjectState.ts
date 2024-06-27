import { Env } from "../../dists/env.js";
import { ImmutableMap } from "../../utility/immutableMap.js";
import { ResolvedModule, ResolvedModuleHash } from "./ResolvedModule.js";
import { SqModuleOutput } from "./SqModuleOutput.js";
import { UnresolvedModule, UnresolvedModuleHash } from "./UnresolvedModule.js";

type ProjectStateData = {
  // Heads point to modules that are important to keep, similar to git branches.
  // Everything else will be garbage-collected eventually.
  heads: ImmutableMap<string, UnresolvedModuleHash>;

  // Unresolved modules are modules that have not been fully loaded (deeply
  // resolved imports) yet.
  unresolvedModules: ImmutableMap<UnresolvedModuleHash, UnresolvedModule>;

  // Resolved modules are immutable: we've loaded all imports and
  // imports-of-imports and so on, and confirmed with a hash that they are
  // immutable.
  resolvedModules: ImmutableMap<ResolvedModuleHash, ResolvedModule>;

  // Outputs are the results of running a module in a specific environment.
  outputs: ImmutableMap<ResolvedModuleHash, SqModuleOutput>;
};

export class ProjectState implements ProjectStateData {
  heads: ProjectStateData["heads"];
  unresolvedModules: ProjectStateData["unresolvedModules"];
  resolvedModules: ProjectStateData["resolvedModules"];
  outputs: ProjectStateData["outputs"];

  private constructor(props: ProjectStateData) {
    this.heads = props.heads;
    this.unresolvedModules = props.unresolvedModules;
    this.resolvedModules = props.resolvedModules;
    this.outputs = props.outputs;
  }

  static init() {
    return new ProjectState({
      heads: ImmutableMap(),
      unresolvedModules: ImmutableMap(),
      resolvedModules: ImmutableMap(),
      outputs: ImmutableMap(),
    });
  }

  clone(params: Partial<Omit<ProjectStateData, "module">>): ProjectState {
    return new ProjectState({
      heads: params.heads ?? this.heads,
      resolvedModules: params.resolvedModules ?? this.resolvedModules,
      unresolvedModules: params.unresolvedModules ?? this.unresolvedModules,
      outputs: params.outputs ?? this.outputs,
    });
  }

  getUnresolvedModule(params: {
    sourceId: string;
    hash?: UnresolvedModuleHash;
  }): UnresolvedModule | undefined {
    if (params.hash) {
      return this.unresolvedModules.get(params.hash);
    } else {
      // TODO - this is slow, prebuild reversed index
      for (const module of this.unresolvedModules.values()) {
        if (module.name === params.sourceId) {
          return module;
        }
      }
      return undefined;
    }
  }

  getResolvedModule(module: UnresolvedModule): ResolvedModule | undefined {
    // TODO - this is slow, prebuild reversed index
    for (const resolved of this.resolvedModules.values()) {
      if (resolved.module === module) {
        return resolved;
      }
    }
    return undefined;
  }

  getParents(module: UnresolvedModule) {
    const parents: UnresolvedModuleHash[] = [];
    for (const [hash, mod] of this.unresolvedModules) {
      if (
        mod
          .imports()
          .some(
            (imp) =>
              imp.name === module.name &&
              (!mod.pins[imp.name] || mod.pins[imp.name] === module.hash())
          )
      ) {
        parents.push(hash);
      }
    }
    return parents;
  }

  getResolvedParents(module: ResolvedModule) {
    const parents: ResolvedModuleHash[] = [];
    for (const [hash, mod] of this.resolvedModules) {
      if (
        Object.values(mod.resolutions).some(
          (imp) => imp.hash() === module.hash()
        )
      ) {
        parents.push(hash);
      }
    }
    return parents;
  }

  getOutput(
    module: ResolvedModule,
    environment: Env
  ): SqModuleOutput | undefined {
    return this.outputs.get(
      SqModuleOutput.hash({
        module,
        environment,
      })
    );
  }
}
