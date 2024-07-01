import { defaultEnv, Env } from "../../dists/env.js";
import { ImmutableMap } from "../../utility/immutableMap.js";
import { ModuleHash, SqModule } from "./SqModule.js";
import { SqModuleOutput } from "./SqModuleOutput.js";

export type SqProjectHead = {
  hash: ModuleHash;
  // TODO - per-head environments
};

type ProjectStateData = {
  // Heads point to modules that are important to keep, similar to git branches.
  // Everything else will be garbage-collected eventually.
  heads: ImmutableMap<string, SqProjectHead>;

  modules: ImmutableMap<ModuleHash, SqModule>;

  // sourceId -> hash for imported source ids that are not pinned.
  resolutions: ImmutableMap<string, ModuleHash>;

  // TODO: environment should be per-head. But it's difficult because we'd have
  // to track outputs per-head, and for that we'd have to store information
  // about which heads require which modules.
  environment: Env;

  // Outputs are the results of running a module in a specific environment.
  outputs: ImmutableMap<ModuleHash, SqModuleOutput>;
};

export class ProjectState implements ProjectStateData {
  readonly heads: ProjectStateData["heads"];
  readonly modules: ProjectStateData["modules"];
  readonly resolutions: ProjectStateData["resolutions"];
  readonly outputs: ProjectStateData["outputs"];
  readonly environment: ProjectStateData["environment"];

  private constructor(props: ProjectStateData) {
    this.heads = props.heads;
    this.modules = props.modules;
    this.resolutions = props.resolutions;
    this.outputs = props.outputs;
    this.environment = props.environment;
  }

  static init() {
    return new ProjectState({
      heads: ImmutableMap(),
      modules: ImmutableMap(),
      resolutions: ImmutableMap(),
      outputs: ImmutableMap(),
      environment: defaultEnv,
    });
  }

  withEnvironment(environment: Env) {
    return this.clone({
      environment,
      // Reset outputs when environment changes.
      // SqProject will trigger output recalculations.
      outputs: ImmutableMap(),
    });
  }

  clone(params: Partial<ProjectStateData>): ProjectState {
    return new ProjectState({
      heads: params.heads ?? this.heads,
      modules: params.modules ?? this.modules,
      resolutions: params.resolutions ?? this.resolutions,
      outputs: params.outputs ?? this.outputs,
      environment: params.environment ?? this.environment,
    });
  }

  withModule(module: SqModule): ProjectState {
    return this.clone({
      modules: this.modules.set(module.hash(), module),
    });
  }

  withOutput(output: SqModuleOutput): ProjectState {
    return this.clone({
      outputs: this.outputs.set(output.hash(), output),
    });
  }

  getModule(params: {
    sourceId: string;
    hash?: ModuleHash;
  }): SqModule | undefined {
    if (params.hash) {
      return this.modules.get(params.hash);
    } else {
      // TODO - this is slow, prebuild sourceId -> modules index
      // TODO - how can we handle multiple modules with the same name?
      for (const module of this.modules.values()) {
        if (module.name === params.sourceId) {
          return module;
        }
      }
      return undefined;
    }
  }

  getParents(module: SqModule) {
    const parents: ModuleHash[] = [];
    for (const [hash, mod] of this.modules) {
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

  getOutput(module: SqModule, environment: Env): SqModuleOutput | undefined {
    return this.outputs.get(
      SqModuleOutput.hash({
        module,
        environment,
      })
    );
  }

  allImportsHaveOutputs(module: SqModule, environment: Env): boolean {
    for (const importBinding of module.imports()) {
      const importedModuleHash =
        module.pins[importBinding.name] ??
        this.resolutions.get(importBinding.name);
      if (!importedModuleHash) {
        return false; // not resolved yet
      }
      const importedModule = this.modules.get(importedModuleHash);
      if (!importedModule) {
        // if resolution exists, it also should be in the modules
        throw new Error("Imported module not found in state");
      }
      const importOutputHash = SqModuleOutput.hash({
        module: importedModule,
        environment,
      });
      const output = this.outputs.get(importOutputHash);
      if (!output) {
        return false;
      }
    }
    return true;
  }

  // Remove modules from the state that are not reachable from the heads.
  gc(): ProjectState {
    const headHashes = new Set(
      [...this.heads.values()].map((head) => head.hash)
    );

    // Key => heads that use this module.
    // This information is unused now, but it could be useful later when we
    // start tracking per-head environments.
    const usedModules = new Map<ModuleHash, Set<string>>();

    // for resolutions, we're only interested in whether they're used in any head
    const usedResolutions = new Set<string>();

    for (const headHash of headHashes) {
      const dfs = (hash: ModuleHash) => {
        usedModules.set(
          hash,
          (usedModules.get(hash) ?? new Set()).add(headHash)
        );

        const module = this.modules.get(hash);
        if (!module) {
          return;
        }
        for (const importBinding of module.imports() ?? []) {
          let importedModuleHash: string | undefined =
            module.pins[importBinding.name];

          if (!importedModuleHash) {
            importedModuleHash = this.resolutions.get(importBinding.name);
            usedResolutions.add(importBinding.name);
          }

          if (
            importedModuleHash &&
            !usedModules.get(importedModuleHash)?.has(headHash)
          ) {
            dfs(importedModuleHash);
          }
        }
      };

      dfs(headHash);
    }

    const newModules = this.modules.filter((_, hash) => usedModules.has(hash));
    const newResolutions = this.resolutions.filter((_, hash) =>
      usedResolutions.has(hash)
    );

    const usedOutputs = new Set<string>();
    for (const output of this.outputs.values()) {
      if (
        usedModules.has(output.module.hash()) &&
        output.environment === this.environment
      ) {
        usedOutputs.add(output.hash());
      }
    }
    const newOutputs = this.outputs.filter((_, hash) => usedOutputs.has(hash));

    return this.clone({
      modules: newModules,
      resolutions: newResolutions,
      outputs: newOutputs,
    });
  }
}
