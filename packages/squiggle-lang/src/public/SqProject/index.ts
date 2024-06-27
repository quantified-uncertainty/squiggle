import { defaultEnv, Env } from "../../dists/env.js";
import { BaseRunner } from "../../runners/BaseRunner.js";
import { getDefaultRunner } from "../../runners/index.js";
import { defaultLinker, SqLinker } from "../SqLinker.js";
import { ProjectState } from "./ProjectState.js";
import { ResolvedModule, ResolvedModuleHash } from "./ResolvedModule.js";
import { SqModuleOutput } from "./SqModuleOutput.js";
import {
  Project2Action,
  Project2Event,
  Project2EventListener,
  Project2EventShape,
  Project2EventType,
} from "./types.js";
import { UnresolvedModule } from "./UnresolvedModule.js";

/*
 * SqProject is a Squiggle project, which is a collection of modules and their
 * dependencies.
 *
 * The project is responsible for loading and resolving modules, building
 * outputs, and running the project.
 *
 * The project is uses the [Functional Core, Imperative
 * Shell](https://codemirror.net/docs/guide/#functional-core%2C-imperative-shell)
 * approach: its state is immutable and updated by dispatching actions.
 *
 * The project is also an event target, and emits events when outputs are built;
 * it provides some helpers for waiting for outputs with async/await, but events
 * are the primary way to interact with the project. One of the reasons for this
 * is that runs can have multiple steps (load dependencies, run them, then run
 * the parent), but should be cancellable: if the root source code changes, we
 * don't want to run the old code.
 *
 * When the project is initialized, it will fire the first "loadImports" action,
 * which will eventually dispatch other actions to load all dependencies and run
 * the root module.
 */
export class SqProject {
  state: ProjectState;
  linker: SqLinker;
  runner: BaseRunner;
  environment: Env;

  constructor(params: {
    rootSource: UnresolvedModule;
    linker?: SqLinker;
    runner?: BaseRunner;
    environment?: Env;
  }) {
    this.state = ProjectState.init();
    this.linker = params.linker ?? defaultLinker;
    this.runner = params.runner ?? getDefaultRunner();
    this.environment = params.environment ?? defaultEnv;
    this.setRootModule(params.rootSource);
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

  setRootModule(rootModule: UnresolvedModule) {
    this.state = this.state.clone({
      heads: this.state.heads.set("root", rootModule.hash()),
      unresolvedModules: this.state.unresolvedModules.set(
        rootModule.hash(),
        rootModule
      ),
    });

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

  dispatch(action: Project2Action) {
    this.dispatchEvent({ type: "action", payload: action });

    switch (action.type) {
      case "loadImports": {
        const module = this.state.unresolvedModules.get(action.payload);
        if (!module) {
          throw new Error(`Module not found: ${action.payload}`);
        }
        for (const imp of module.imports()) {
          // TODO - how can we de-dupe this? If two modules import the same module, we'll load it twice.
          // Should we mark in the state that we're loading it?
          this.dispatch({
            type: "loadModule",
            payload: {
              name: imp.name,
              hash: module.pins[imp.name],
            },
          });
        }
        break;
      }
      case "loadModule": {
        this.linker
          .loadModule(action.payload.name, action.payload.hash)
          .then((module) => {
            if (!this.state.unresolvedModules.has(module.hash())) {
              this.dispatch({
                type: "addModule",
                payload: {
                  module,
                },
              });
            }
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
        } else {
          this.dispatch({
            type: "loadImports",
            payload: module.hash(),
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
            sourceId: imp.name,
            hash: unresolvedModule.pins[imp.name],
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
          resolutions[imp.name] = resolvedImport;
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

        SqModuleOutput.make({
          module,
          environment,
          runner: this.runner,
          state: this.state,
        }).then((output) => {
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

  getOutput(): SqModuleOutput | undefined {
    const resolved = this.state.getResolvedModule(this.getRootModule());
    if (!resolved) {
      // Root module is not resolved yet;
      return undefined;
    }
    const output = this.state.outputs.get(
      SqModuleOutput.hash({
        module: resolved,
        environment: this.environment,
      })
    );
    if (!output) {
      return undefined;
    }
    return output;
  }

  private allImportsHaveOutputs(
    module: ResolvedModule,
    environment: Env
  ): boolean {
    for (const importBinding of module.module.imports()) {
      const importedModule = module.resolutions[importBinding.name];
      if (!importedModule) {
        // shouldn't happen, ResolvedModule constructor verifies that imports and resolutions match
        throw new Error(
          `Can't find resolved import module ${importBinding.name}`
        );
      }
      const importOutputHash = SqModuleOutput.hash({
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

  // Helper for awaiting the root module output.
  async runRoot(): Promise<SqModuleOutput> {
    const existingOutput = this.getOutput();
    if (existingOutput) {
      return existingOutput;
    }

    return new Promise<SqModuleOutput>((resolve) => {
      const listener: Project2EventListener<"output"> = (event) => {
        if (event.data.output.module.module === this.getRootModule()) {
          this.removeEventListener("output", listener);
          resolve(event.data.output);
        }
      };
      this.addEventListener("output", listener);
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
