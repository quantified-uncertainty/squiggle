import { defaultEnv, Env } from "../../dists/env.js";
import { BaseRunner } from "../../runners/BaseRunner.js";
import { getDefaultRunner } from "../../runners/index.js";
import { SqOtherError } from "../SqError.js";
import { defaultLinker, SqLinker } from "../SqLinker.js";
import { ModulePointer, ProjectState } from "./ProjectState.js";
import { SqModule } from "./SqModule.js";
import { SqModuleOutput } from "./SqModuleOutput.js";
import {
  ProjectAction,
  ProjectEvent,
  ProjectEventListener,
  ProjectEventShape,
  ProjectEventType,
} from "./types.js";

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
 * The project is also an event target, and emits events when outputs are built
 * or actions are dispatched; it provides some helpers for waiting for outputs
 * with async/await, but events are the primary way to interact with the
 * project. One of the reasons for this is that runs can have multiple steps
 * (load dependencies, run them, then run the parent), but should be
 * cancellable: if the head source code changes, we don't want to run the old
 * code.
 *
 * When the new head is added to the project, it will fire the first
 * "loadImports" action, which will eventually dispatch other actions to load
 * all dependencies and run the head module.
 */
export class SqProject {
  state: ProjectState;
  runner: BaseRunner; // TODO: move to state

  constructor(
    params: {
      linker?: SqLinker;
      runner?: BaseRunner;
      environment?: Env;
    } = {}
  ) {
    this.runner = params.runner ?? getDefaultRunner();
    this.state = ProjectState.init({
      linker: params.linker ?? defaultLinker,
      environment: params.environment ?? defaultEnv,
    });
  }

  // Public methods

  setHead(headName: string, head: { module: SqModule }) {
    const hash = head.module.hash();
    this.setState(
      this.state.clone({
        heads: this.state.heads.set(headName, {
          hash,
        }),
        modules: this.state.modules.set(hash, {
          type: "loaded",
          value: head.module,
        }),
      })
    );

    this.dispatch({ type: "gc" });
    this.dispatch({
      type: "processModule",
      payload: { hash },
    });
  }

  async loadHead(headName: string, head: { moduleName: string }) {
    const module = await this.state.linker.loadModule(head.moduleName);
    this.setHead(headName, { module });
  }

  // Helper method for setting a head with a simple code string.
  // Source name will be identical to the head name.
  setSimpleHead(headName: string, code: string) {
    this.setHead(headName, { module: new SqModule({ name: headName, code }) });
  }

  setEnvironment(environment: Env) {
    // TODO - do this through dispatch?
    // This will clean all outputs.
    this.setState(this.state.withEnvironment(environment));

    // Rebuild outputs.
    for (const hash of this.state.modules.keys()) {
      this.dispatch({
        type: "buildOutputIfPossible",
        payload: { hash, environment },
      });
    }
  }

  setRunner(runner: BaseRunner) {
    this.runner = runner;
  }

  hasHead(headName: string): boolean {
    return this.state.heads.has(headName);
  }

  getOutput(headName: string): SqModuleOutput | undefined {
    return this.state.outputs.get(
      SqModuleOutput.hash({
        module: this.getHead(headName),
        environment: this.state.environment,
      })
    );
  }

  getModuleOrThrow(hash: string): SqModule {
    const module = this.state.modules.get(hash);
    if (!module) {
      throw new Error(`Module not found: ${hash}`);
    }
    if (module.type !== "loaded") {
      throw new Error(`Module is not loaded yet: ${hash}`);
    }
    return module.value;
  }

  getHead(headName: string): SqModule {
    const moduleHash = this.state.heads.get(headName)?.hash;
    if (!moduleHash) {
      throw new Error(`Head ${headName} not found`);
    }
    return this.getModuleOrThrow(moduleHash);
  }

  async waitForOutput(headName: string): Promise<SqModuleOutput> {
    const existingOutput = this.getOutput(headName);
    if (existingOutput) {
      return existingOutput;
    }

    return new Promise<SqModuleOutput>((resolve) => {
      const listener: ProjectEventListener<"output"> = (event) => {
        if (event.data.output.module === this.getHead(headName)) {
          this.removeEventListener("output", listener);
          resolve(event.data.output);
        }
      };
      this.addEventListener("output", listener);
    });
  }

  // Dispatch methods

  dispatch(action: ProjectAction) {
    this.dispatchEvent({ type: "action", payload: action });

    switch (action.type) {
      case "loadImports": {
        this.loadImports(action.payload);
        break;
      }
      case "loadModule": {
        this.loadModule({
          name: action.payload.name,
          hash: action.payload.hash,
        });
        break;
      }
      case "processModule": {
        this.processModule(action.payload.hash);
        break;
      }
      case "buildOutputIfPossible": {
        this.buildOutputIfPossible(
          action.payload.hash,
          action.payload.environment
        );
        break;
      }
      case "gc": {
        // Remove modules from the state that are not reachable from the heads.
        this.setState(this.state.gc());
        break;
      }
      default:
        throw action satisfies never;
    }
  }

  private loadImports(hash: string) {
    const module = this.getModuleOrThrow(hash);

    for (const imp of module.getImports(this.state.linker)) {
      if (module.pins[imp.name]) {
        if (this.state.modules.has(module.pins[imp.name])) {
          // pinned import is already loaded
          continue;
        }
      } else {
        const resolvedHash = this.state.resolutions.get(imp.name);
        if (resolvedHash) {
          // unpinned import is already loaded
          continue;
        }
      }

      // TODO - mark in the state that we're loading a module.
      // Otherwise if two modules import the same module asynchronously, we'll load it twice.
      this.dispatch({
        type: "loadModule",
        payload: {
          name: imp.name,
          hash: module.pins[imp.name],
        },
      });
    }
  }

  private async loadModule({ name, hash }: ModulePointer) {
    if (hash) {
      this.setState(
        this.state.clone({
          modules: this.state.modules.set(hash, { type: "loading" }),
        })
      );
    } else {
      this.setState(
        this.state.clone({
          resolutions: this.state.resolutions.set(name, { type: "loading" }),
        })
      );
    }

    try {
      const module = await this.state.linker.loadModule(name, hash);
      if (hash && hash !== module.hash()) {
        throw new Error(
          `Hash mismatch for module ${name}: expected ${hash}, got ${module.hash()}`
        );
      }

      if (!hash) {
        this.setState(
          this.state.clone({
            resolutions: this.state.resolutions.set(name, {
              type: "loaded",
              value: module.hash(),
            }),
          })
        );
      }

      this.setState(this.state.withModule(module));
      this.dispatch({
        type: "processModule",
        payload: { hash: module.hash() },
      });
    } catch (e) {
      // loading has failed
      if (hash) {
        this.setState(
          this.state.clone({
            modules: this.state.modules.set(hash, {
              type: "failed",
              value: String(e),
            }),
          })
        );
      } else {
        this.setState(
          this.state.clone({
            resolutions: this.state.resolutions.set(name, {
              type: "failed",
              value: String(e),
            }),
          })
        );
      }

      // even if loading failed, we should try to build outputs for parents
      for (const parent of this.state.getParents({
        name,
        hash,
      })) {
        this.dispatch({
          type: "buildOutputIfPossible",
          payload: { hash: parent, environment: this.state.environment },
        });
      }
    }
  }

  // If the module is already loaded, we'll to build its output.
  // Otherwise, we'll load its imports, which will eventually trigger the build.
  // If the output is impossible to build, e.g. because of circular imports, we'll produce a failed output.
  private processModule(hash: string) {
    const module = this.getModuleOrThrow(hash);

    const loadingStatus = this.state.getLoadingStatus({
      name: module.name,
      hash,
    });

    switch (loadingStatus.type) {
      case "loaded":
      case "failed":
      case "circular":
        this.dispatch({
          type: "buildOutputIfPossible",
          payload: {
            hash: module.hash(),
            environment: this.state.environment,
          },
        });
        break;
      case "not-loaded":
        this.dispatch({
          type: "loadImports",
          payload: module.hash(),
        });
        break;
      default:
        throw loadingStatus satisfies never;
    }
  }

  private async buildOutputIfPossible(hash: string, environment: Env) {
    const module = this.getModuleOrThrow(hash);

    // output already exists
    if (this.state.outputs.has(SqModuleOutput.hash({ module, environment }))) {
      return;
    }

    const loadingStatus = this.state.getLoadingStatus({
      name: module.name,
      hash,
    });
    let output: SqModuleOutput | undefined;
    if (loadingStatus.type === "circular") {
      output = SqModuleOutput.makeError({
        module,
        environment,
        error: new SqOtherError(
          `Circular import: ${loadingStatus.path.join(" -> ")}`
        ), // TODO - details
      });
    } else {
      // TODO - try/catch?
      // TODO - mark as building?
      output = await SqModuleOutput.make({
        module,
        environment,
        runner: this.runner,
        state: this.state,
      });
    }

    if (!output) {
      return;
    }

    this.setState(this.state.withOutput(output));
    this.dispatchEvent({ type: "output", payload: { output } });

    for (const parent of this.state.getParents({
      name: module.name,
      hash: module.hash(),
    })) {
      this.dispatch({
        type: "buildOutputIfPossible",
        payload: { hash: parent, environment },
      });
    }
  }

  // Event methods

  private eventTarget = new EventTarget();

  private dispatchEvent(shape: ProjectEventShape) {
    this.eventTarget.dispatchEvent(new ProjectEvent(shape.type, shape.payload));
  }

  addEventListener<T extends ProjectEventType>(
    type: T,
    listener: ProjectEventListener<T>
  ) {
    this.eventTarget.addEventListener(type, listener as (event: Event) => void);
  }

  removeEventListener<T extends ProjectEventType>(
    type: T,
    listener: ProjectEventListener<T>
  ) {
    this.eventTarget.removeEventListener(
      type,
      listener as (event: Event) => void
    );
  }

  // Internal helpers

  // All state changes should go through this method, so we can emit events.
  private setState(newState: ProjectState) {
    this.state = newState;
    this.dispatchEvent({ type: "state", payload: this.state });
  }
}
