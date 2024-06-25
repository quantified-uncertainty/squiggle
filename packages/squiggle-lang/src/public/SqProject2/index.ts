import { Env } from "../../dists/env.js";
import { BaseRunner, RunParams } from "../../runners/BaseRunner.js";
import { getDefaultRunner } from "../../runners/index.js";
import { ImmutableMap } from "../../utility/immutableMap.js";
import { Err, fmap, fmap2 } from "../../utility/result.js";
import { vDict, VDict } from "../../value/VDict.js";
import { wrapError } from "../SqError.js";
import { SqLinker } from "../SqLinker.js";
import { Externals, RunContext } from "../SqProject/ProjectItem.js";
import { SqOutput, SqOutputResult } from "../types.js";
import { ModuleOutput } from "./ModuleOutput.js";
import { ProjectState } from "./ProjectState.js";
import { ResolvedModule, ResolvedModuleHash } from "./ResolvedModule.js";
import {
  Project2Action,
  Project2Event,
  Project2EventListener,
  Project2EventShape,
  Project2EventType,
} from "./types.js";
import { UnresolvedModule } from "./UnresolvedModule.js";

export class SqProject2 {
  private state: ProjectState;
  linker: SqLinker;
  runner: BaseRunner;
  environment: Env;

  constructor(params: {
    rootSource: UnresolvedModule;
    linker: SqLinker;
    runner?: BaseRunner;
    environment: Env;
  }) {
    let state = ProjectState.init();
    state = state.clone({
      heads: state.heads.set("root", params.rootSource.hash()),
      unresolvedModules: state.unresolvedModules.set(
        params.rootSource.hash(),
        params.rootSource
      ),
    });
    this.state = state;
    this.linker = params.linker;
    this.runner = params.runner ?? getDefaultRunner();
    this.environment = params.environment;

    this.dispatch({
      type: "loadImports",
      payload: this.getRootHash(),
    });
    this.dispatch({
      type: "resolveIfPossible",
      payload: {
        hash: this.getRootHash(),
      },
    });
  }

  private getRootHash(): string {
    const result = this.state.heads.get("root");
    if (!result) {
      throw new Error("Root head not found");
    }
    return result;
  }

  private getRootModule(): UnresolvedModule {
    const module = this.state.unresolvedModules.get(this.getRootHash());
    if (!module) {
      throw new Error("Root head module not found");
    }
    return module;
  }

  dispatch(action: Project2Action) {
    this.dispatchEvent({ type: "action", payload: action });

    switch (action.type) {
      case "loadImports": {
        const module = this.state.unresolvedModules.get(action.payload);
        if (!module) {
          throw new Error(`Module not found: ${action.payload}`);
        }
        for (const imp of module.imports()) {
          this.dispatch({
            type: "loadModule",
            payload: {
              sourceId: imp.sourceId,
              hash: module.pins[imp.sourceId],
            },
          });
        }
        break;
      }
      case "loadModule": {
        this.linker
          .loadModule(action.payload.sourceId, action.payload.hash)
          .then((module) => {
            this.dispatch({
              type: "addModule",
              payload: {
                module,
              },
            });
          });
        break;
      }
      case "addModule": {
        const { module } = action.payload;
        this.state = this.state.clone({
          unresolvedModules: this.state.unresolvedModules.set(
            module.hash(),
            module
          ),
        });

        if (module.imports().length === 0) {
          this.dispatch({
            type: "resolveIfPossible",
            payload: { hash: module.hash() },
          });
        }
        break;
      }
      case "resolveIfPossible": {
        const { hash } = action.payload;

        const unresolvedModule = this.state.unresolvedModules.get(hash);
        if (!unresolvedModule) {
          // TODO - warn
          return;
        }
        if (this.state.getResolvedModule(unresolvedModule)) {
          // already resolved
          break;
        }

        const resolutions: Record<ResolvedModuleHash, ResolvedModule> = {};

        let allResolved = true;
        for (const imp of unresolvedModule.imports()) {
          const unresolvedImport = this.state.getUnresolvedModule({
            sourceId: imp.sourceId,
            hash: unresolvedModule.pins[imp.sourceId],
          });
          if (!unresolvedImport) {
            // import is not loaded yet
            allResolved = false;
            break;
          }
          const resolvedImport = this.state.getResolvedModule(unresolvedImport);
          if (!resolvedImport) {
            // import is not resolved yet
            allResolved = false;
            break;
          }
          resolutions[imp.sourceId] = resolvedImport;
        }

        if (!allResolved) {
          // not possible to resolve yet
          break;
        }

        const resolvedModule = new ResolvedModule(
          unresolvedModule,
          resolutions
        );

        this.state = this.state.clone({
          resolvedModules: this.state.resolvedModules.set(
            resolvedModule.hash(),
            resolvedModule
          ),
        });

        this.dispatch({
          type: "buildOutputIfPossible",
          payload: {
            hash: resolvedModule.hash(),
            environment: this.environment,
          },
        });

        // 1) all that import sourceId without pins
        // 2) all that import sourceId with the matching pin
        for (const parent of this.state.getParents(unresolvedModule)) {
          this.dispatch({
            type: "resolveIfPossible",
            payload: { hash: parent },
          });
        }

        break;
      }
      case "buildOutputIfPossible": {
        const { hash, environment } = action.payload;
        const module = this.state.resolvedModules.get(hash);
        if (!module) {
          throw new Error(`Can't find module with hash ${hash}`);
        }

        if (!this.allImportsHaveOutputs(module, environment)) {
          break;
        }

        this.buildOutput({ module, environment }).then((output) => {
          this.state = this.state.clone({
            outputs: this.state.outputs.set(output.hash(), output),
          });
          this.dispatchEvent({ type: "output", payload: { output } });

          for (const parent of this.state.getResolvedParents(module)) {
            this.dispatch({
              type: "buildOutputIfPossible",
              payload: { hash: parent, environment },
            });
          }
        });
        // TODO - catch?

        break;
      }
      default:
        throw action satisfies never;
    }
  }

  getOutput(): SqOutputResult | undefined {
    const resolved = this.state.getResolvedModule(this.getRootModule());
    if (!resolved) {
      // Root module is not resolved yet;
      return undefined;
    }
    const output = this.state.outputs.get(
      ModuleOutput.hash({
        module: resolved,
        environment: this.environment,
      })
    );
    if (!output) {
      return undefined;
    }
    return fmap(output.output, (output) =>
      SqOutput.fromProjectItemOutput(output)
    );
  }

  private allImportsHaveOutputs(
    module: ResolvedModule,
    environment: Env
  ): boolean {
    for (const importBinding of module.module.imports()) {
      const importedModule = module.resolutions[importBinding.sourceId];
      if (!importedModule) {
        // shouldn't happen, ResolvedModule constructor verifies that imports and resolutions match
        throw new Error(
          `Can't find resolved import module ${importBinding.sourceId}`
        );
      }
      const importOutputHash = ModuleOutput.hash({
        module: importedModule,
        environment,
      });
      const output = this.state.outputs.get(importOutputHash);
      if (!output) {
        return false;
      }
    }
    return true;
  }

  private async buildOutput(params: {
    module: ResolvedModule;
    environment: Env;
  }): Promise<ModuleOutput> {
    const { environment, module } = params;

    const astR = module.module.ast();
    if (!astR.ok) {
      return new ModuleOutput({
        module,
        environment,
        output: Err(astR.value),
      });
    }
    const ast = astR.value;

    let importBindings = VDict.empty();

    for (const importBinding of module.module.imports()) {
      const importedModule = module.resolutions[importBinding.sourceId];
      if (!importedModule) {
        // shouldn't happen, ResolvedModule constructor verifies that imports and resolutions match
        throw new Error(
          `Can't find resolved import module ${importBinding.sourceId}`
        );
      }
      const importOutputHash = ModuleOutput.hash({
        module: importedModule,
        environment,
      });
      const output = this.state.outputs.get(importOutputHash);
      if (!output) {
        throw new Error(`Can't find output with hash ${importOutputHash}`);
      }
      if (!output.output.ok) {
        return output;
      }
      importBindings = importBindings.merge(
        vDict(
          ImmutableMap({
            [importBinding.variable]: output.output.value.runOutput.exports,
          })
        )
      );
    }
    const externals: Externals = {
      implicitImports: vDict(ImmutableMap()),
      explicitImports: importBindings,
    };

    const context: RunContext = {
      ast,
      sourceId: module.module.name,
      source: module.module.code,
      environment,
      externals,
    };

    const runParams: RunParams = {
      ast,
      environment,
      externals: importBindings,
    };

    const started = new Date();
    const runResult = await this.runner.run(runParams);
    const executionTime = new Date().getTime() - started.getTime();

    // // patch profile - add timings for import statements
    // if (runResult.ok && runResult.value.profile) {
    //   for (const item of module.module.imports()) {
    //     const importOutput = project.getInternalOutput(item.sourceId);
    //     if (importOutput.ok) {
    //       runResult.value.profile.addRange(
    //         item.location,
    //         importOutput.value.executionTime
    //       );
    //     }
    //   }
    // }

    const output = fmap2(
      runResult,
      (runOutput) => ({ runOutput, context, executionTime }),
      (err) => wrapError(err)
    );
    return new ModuleOutput({
      module,
      environment,
      output,
    });
  }

  private eventTarget = new EventTarget();

  private dispatchEvent(shape: Project2EventShape) {
    this.eventTarget.dispatchEvent(
      new Project2Event(shape.type, shape.payload)
    );
  }

  addEventListener<T extends Project2EventType>(
    type: T,
    listener: Project2EventListener<T>
  ) {
    this.eventTarget.addEventListener(type, listener as (event: Event) => void);
  }

  removeEventListener<T extends Project2EventType>(
    type: T,
    listener: Project2EventListener<T>
  ) {
    this.eventTarget.removeEventListener(
      type,
      listener as (event: Event) => void
    );
  }
}
