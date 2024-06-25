import { ImmutableMap } from "../../utility/immutableMap.js";
import { ModuleOutput } from "./ModuleOutput.js";
import { ResolvedModule, ResolvedModuleHash } from "./ResolvedModule.js";
import { UnresolvedModule, UnresolvedModuleHash } from "./UnresolvedModule.js";

type ProjectStateData = {
  module: UnresolvedModule;

  unresolvedModules: ImmutableMap<UnresolvedModuleHash, UnresolvedModule>;
  resolvedModules: ImmutableMap<ResolvedModuleHash, ResolvedModule>;
  outputs: ImmutableMap<ResolvedModuleHash, ModuleOutput>;
};

export class ProjectState implements ProjectStateData {
  module: ProjectStateData["module"];
  unresolvedModules: ProjectStateData["unresolvedModules"];
  resolvedModules: ProjectStateData["resolvedModules"];
  outputs: ProjectStateData["outputs"];

  private constructor(props: ProjectStateData) {
    this.module = props.module;
    this.unresolvedModules = props.unresolvedModules;
    this.resolvedModules = props.resolvedModules;
    this.outputs = props.outputs;
  }

  static init(rootSource: UnresolvedModule) {
    return new ProjectState({
      module: rootSource,
      unresolvedModules: ImmutableMap([[rootSource.hash(), rootSource]]),
      resolvedModules: ImmutableMap(),
      outputs: ImmutableMap(),
    });
  }

  clone({
    resolvedModules,
    unresolvedModules,
    outputs,
  }: Partial<Omit<ProjectStateData, "module">>): ProjectState {
    return new ProjectState({
      module: this.module,
      resolvedModules: resolvedModules ?? this.resolvedModules,
      unresolvedModules: unresolvedModules ?? this.unresolvedModules,
      outputs: outputs ?? this.outputs,
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
              imp.sourceId === module.name &&
              (!mod.pins[imp.sourceId] ||
                mod.pins[imp.sourceId] === module.hash())
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
}
