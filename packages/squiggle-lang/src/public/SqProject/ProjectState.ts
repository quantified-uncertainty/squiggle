import { defaultEnv, Env } from "../../dists/env.js";
import { ImmutableMap, ImmutableSet } from "../../utility/immutable.js";
import { SqLinker } from "../SqLinker.js";
import { Import, importToPointer, SqModule } from "./SqModule.js";
import { SqModuleOutput } from "./SqModuleOutput.js";

// TODO - per-head environments
export type SqProjectHead = {
  hash: string; // module hash
};

// We can point to modules in two different ways:
// 1. by hash, when the module is already loaded, or when the module is pinned so we know the hash apriori
// 2. by name, when we're still resolving the unpinned module
export type ModulePointer = {
  name: string;
  hash: string | undefined;
};

type LoadingStatus =
  /**
   * TODO: should this be "not-loaded" or "loading"? We're not consistent with the terminology.
   * Technically it's usually "loading", because we load all imports as soon as they appear, in `SqProject` dispatch handlers.
   *
   * But:
   * 1) this could change later
   * 2) technically we could detect both `not-loaded` and `loading` separately, and maybe we should do that?
   */

  | { type: "not-loaded" }
  | { type: "loaded" }
  | { type: "circular"; path: Import[] }
  | { type: "failed" };

type ResolutionData =
  | {
      type: "loading";
    }
  | {
      type: "failed";
      value: string; // error message
    }
  | {
      type: "loaded";
      value: string; // module hash
    };

export type ModuleData =
  | {
      type: "loading";
    }
  | {
      type: "failed";
      value: string;
    }
  | {
      type: "loaded";
      value: SqModule;
    };

type ProjectStateData = {
  // Heads point to modules that are important to keep, similar to git branches.
  // Everything else will be garbage-collected eventually.
  heads: ImmutableMap<string, SqProjectHead>;

  // Module name -> hash for imported module names that are not pinned.
  // `resolutions` and `modules` are similar; `resolutions` point to `modules`,
  // and you can address a module that's possibly unpinned through
  // `ModulePointer`.
  resolutions: ImmutableMap<string, ResolutionData>;

  // Module hash -> module
  modules: ImmutableMap<string, ModuleData>;

  // TODO: environment should be per-head. But it's difficult because we'd have
  // to track outputs per-head, and for that we'd have to store information
  // about which heads require which modules.
  environment: Env;

  // Outputs are the results of running a module in a specific environment.
  outputs: ImmutableMap<string, SqModuleOutput>;

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

  getModuleDataByPointer(modulePointer: ModulePointer): ModuleData | undefined {
    if (modulePointer.hash) {
      return this.modules.get(modulePointer.hash);
    }
    const resolution = this.resolutions.get(modulePointer.name);
    if (resolution?.type !== "loaded") {
      return resolution;
    }
    return this.modules.get(resolution.value);
  }

  getParents(modulePointer: ModulePointer) {
    // TODO - maintain the list of parents in the state, so we don't have to scan all modules.
    const parents: string[] = []; // hashes
    for (const [hash, entry] of this.modules) {
      if (entry.type !== "loaded") {
        continue;
      }
      const mod = entry.value;

      if (
        mod
          .getImports(this.linker)
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

  // TODO - this method traverses the full dependency graph, and we call if often, which is inefficient.
  // We could track the loading status of each module, and update it as we load modules.
  getLoadingStatus(modulePointer: ModulePointer): LoadingStatus {
    const moduleData = this.getModuleDataByPointer(modulePointer);
    if (!moduleData) {
      throw new Error("Internal error, module not found");
    }

    // Depth-first search; we need to check if nested imports are loaded, and
    // detect cycles.

    const innerGetLoadingStatus = (
      module: ModuleData | undefined,
      visited: ImmutableSet<string>
    ): LoadingStatus => {
      if (!module || module.type === "loading") {
        return { type: "not-loaded" };
      }
      if (module.type === "failed") {
        return { type: "failed" };
      }

      // now module.type is limited to `loaded`, let's recurse into it

      visited = visited.add(module.value.hash());

      for (const imp of module.value.getImports(this.linker)) {
        const importedModule = this.getModuleDataByPointer(
          importToPointer(imp)
        );
        if (
          importedModule?.type === "loaded" &&
          visited.has(importedModule.value.hash())
        ) {
          return {
            type: "circular",
            path: [imp],
          };
        }

        const status = innerGetLoadingStatus(importedModule, visited);
        if (status.type !== "loaded") {
          return status.type === "circular"
            ? {
                type: "circular",
                path: [imp, ...status.path],
              }
            : status;
        }
      }

      return { type: "loaded" };
    };

    return innerGetLoadingStatus(moduleData, ImmutableSet());
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
    const usedModules = new Map<string, Set<string>>();

    // for resolutions, we're only interested in whether they're used in any head
    const usedResolutions = new Set<string>();

    for (const headHash of headHashes) {
      const dfs = (hash: string) => {
        usedModules.set(
          hash,
          (usedModules.get(hash) ?? new Set()).add(headHash)
        );

        const module = this.modules.get(hash);
        if (!module || module.type !== "loaded") {
          return;
        }
        for (const importBinding of module.value.getImports(this.linker) ??
          []) {
          let importedModuleHash: string | undefined =
            module.value.pins[importBinding.name];

          if (!importedModuleHash) {
            const resolution = this.resolutions.get(importBinding.name);
            if (resolution?.type === "loaded") {
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
