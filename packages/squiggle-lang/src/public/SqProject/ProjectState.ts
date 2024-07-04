import { defaultEnv, Env } from "../../dists/env.js";
import { ImmutableMap } from "../../utility/immutableMap.js";
import { SqLinker } from "../SqLinker.js";
import { ModuleHash, SqModule } from "./SqModule.js";
import { SqModuleOutput } from "./SqModuleOutput.js";

export type SqProjectHead = {
  hash: ModuleHash;
  // TODO - per-head environments
};

// We can point to modules in two different ways:
// 1. by hash, when the module is already loaded, or when the module is pinned so we know the hash apriori
// 2. by name, when we're still resolving the unpinned module
export type ModulePointer = {
  name: string;
  hash: string | undefined;
};

type ResolutionData =
  | {
      type: "loading";
    }
  | {
      type: "resolved";
      value: ModuleHash;
    }
  | {
      type: "failed";
      value: string;
    };

export type ModuleData =
  | {
      type: "loaded";
      value: SqModule;
    }
  | {
      type: "loading";
    }
  | {
      type: "failed";
      value: string;
    };

type ProjectStateData = {
  // Heads point to modules that are important to keep, similar to git branches.
  // Everything else will be garbage-collected eventually.
  heads: ImmutableMap<string, SqProjectHead>;

  modules: ImmutableMap<ModuleHash, ModuleData>;

  // module name -> hash for imported module names that are not pinned.
  resolutions: ImmutableMap<string, ResolutionData>;

  // TODO: environment should be per-head. But it's difficult because we'd have
  // to track outputs per-head, and for that we'd have to store information
  // about which heads require which modules.
  environment: Env;

  // Outputs are the results of running a module in a specific environment.
  outputs: ImmutableMap<ModuleHash, SqModuleOutput>;

  linker: SqLinker;
};

export class ProjectState implements ProjectStateData {
  readonly heads: ProjectStateData["heads"];
  readonly modules: ProjectStateData["modules"];
  readonly resolutions: ProjectStateData["resolutions"];
  readonly outputs: ProjectStateData["outputs"];
  readonly environment: ProjectStateData["environment"];
  readonly linker: ProjectStateData["linker"];

  private constructor(props: ProjectStateData) {
    this.heads = props.heads;
    this.modules = props.modules;
    this.resolutions = props.resolutions;
    this.outputs = props.outputs;
    this.environment = props.environment;
    this.linker = props.linker;
  }

  static init(params: { linker: SqLinker; environment?: Env }) {
    return new ProjectState({
      heads: ImmutableMap(),
      modules: ImmutableMap(),
      resolutions: ImmutableMap(),
      outputs: ImmutableMap(),
      environment: params.environment ?? defaultEnv,
      linker: params.linker,
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

  clone(
    // It usually doesn't make sense to update linker, so we forbid it.
    params: Partial<Omit<ProjectStateData, "linker">>
  ): ProjectState {
    return new ProjectState({
      heads: params.heads ?? this.heads,
      modules: params.modules ?? this.modules,
      resolutions: params.resolutions ?? this.resolutions,
      outputs: params.outputs ?? this.outputs,
      environment: params.environment ?? this.environment,
      linker: this.linker,
    });
  }

  withModule(module: SqModule): ProjectState {
    return this.clone({
      modules: this.modules.set(module.hash(), {
        type: "loaded",
        value: module,
      }),
    });
  }

  withOutput(output: SqModuleOutput): ProjectState {
    return this.clone({
      outputs: this.outputs.set(output.hash(), output),
    });
  }

  getParents(modulePointer: ModulePointer) {
    const parents: ModuleHash[] = [];
    for (const [hash, entry] of this.modules) {
      if (entry.type !== "loaded") {
        continue;
      }
      const mod = entry.value;

      if (
        mod
          .imports(this.linker)
          .some(
            (imp) =>
              imp.name === modulePointer.name &&
              (!mod.pins[imp.name] || mod.pins[imp.name] === modulePointer.hash)
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
        if (!module || module.type !== "loaded") {
          return;
        }
        for (const importBinding of module.value.imports(this.linker) ?? []) {
          let importedModuleHash: string | undefined =
            module.value.pins[importBinding.name];

          if (!importedModuleHash) {
            const resolution = this.resolutions.get(importBinding.name);
            if (resolution?.type === "resolved") {
              importedModuleHash = resolution.value;
              usedResolutions.add(importBinding.name);
            }
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

    // TODO - cleanup failedModules

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
