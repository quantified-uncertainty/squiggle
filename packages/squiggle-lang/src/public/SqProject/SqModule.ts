import { parse } from "../../ast/parse.js";
import { AST, LocationRange } from "../../ast/types.js";
import { Env } from "../../dists/env.js";
import { errMap, result } from "../../utility/result.js";
import { SqCompileError, SqError, SqOtherError } from "../SqError.js";
import { SqLinker } from "../SqLinker.js";
import { ProjectState } from "./ProjectState.js";
import { SqModuleOutput } from "./SqModuleOutput.js";
import { getHash } from "./utils.js";

export type ModuleHash = string;

type Import = {
  name: string;
  variable: string;
  location: LocationRange;
};

type ImportModules =
  | {
      type: "loaded";
      value: Record<string, SqModule>;
    }
  | {
      type: "loading";
    }
  | {
      type: "failed";
      value: SqError;
    };

type ImportOutputs =
  | {
      type: "loaded";
      value: Record<string, SqModuleOutput>;
    }
  | {
      type: "loading"; // or running - i.e. ImportModules might be loaded, but outputs don't exist yet
    }
  | {
      type: "failed";
      value: SqError;
    };

export class SqModule {
  name: string;
  code: string;
  // key is module name
  pins: Record<string, ModuleHash>;

  private _ast?: result<AST, SqError>;

  constructor(params: {
    name: string;
    code: string;
    pins?: Record<string, ModuleHash>;
  }) {
    this.name = params.name;
    this.code = params.code;
    this.pins = params.pins ?? {};
  }

  // For now, parsing is done lazily but synchronously and on happens on the
  // main thread. Parsing is usually fast enough and this makes the
  // implementation simpler.
  ast() {
    if (!this._ast) {
      this._ast = errMap(
        parse(this.code, this.name),
        (e) => new SqCompileError(e)
      );
    }
    return this._ast;
  }

  imports(linker: SqLinker): Import[] {
    const ast = this.ast();
    if (!ast.ok) {
      return [];
    }
    const program = ast.value;

    const resolvedImports: Import[] = [];

    for (const [file, variable] of program.imports) {
      const name = linker.resolve(file.value, this.name);
      resolvedImports.push({
        variable: variable.value,
        name,
        // TODO - this is used for errors, but we should use the entire import statement;
        // To fix this, we need to represent each import statement as an AST node.
        location: file.location,
      });
    }

    return resolvedImports;
  }

  hash(): ModuleHash {
    return (
      `module-${this.name}-` +
      getHash(
        JSON.stringify({
          name: this.name,
          code: this.code,
          pins: this.pins,
        })
      )
    );
  }

  // Helper methods

  importModules({ state }: { state: ProjectState }): ImportModules {
    const ast = this.ast();
    if (!ast.ok) {
      return {
        type: "failed",
        value: ast.value,
      };
    }

    const result: Record<string, SqModule> = {};
    for (const importBinding of this.imports(state.linker)) {
      let importedModuleHash = this.pins[importBinding.name];
      if (!importedModuleHash) {
        const resolution = state.resolutions.get(importBinding.name);
        if (resolution?.type === "resolved") {
          importedModuleHash = resolution.value;
        } else if (resolution?.type === "failed") {
          return { type: "failed", value: new SqOtherError(resolution.value) };
        } else {
          return { type: "loading" };
        }
      }
      const importedModule = state.modules.get(importedModuleHash);
      if (!importedModule) {
        // internal error - if resolution exists, it also should be in the modules
        throw new Error("Imported module not found in state");
      }
      if (importedModule.type === "failed") {
        return {
          type: "failed",
          value: new SqOtherError(importedModule.value),
        };
      }

      if (importedModule.type === "loading") {
        return { type: "loading" };
      }

      result[importBinding.name] = importedModule.value;
    }
    return { type: "loaded", value: result };
  }

  importOutputs({
    state,
    environment,
  }: {
    state: ProjectState;
    environment: Env;
  }): ImportOutputs {
    const importModules = this.importModules({ state });
    if (importModules.type !== "loaded") {
      return importModules;
    }

    const result: Record<string, SqModuleOutput> = {};
    for (const [name, module] of Object.entries(importModules.value)) {
      const importOutputHash = SqModuleOutput.hash({ module, environment });
      const output = state.outputs.get(importOutputHash);
      if (!output) {
        return { type: "loading" };
      }
      result[name] = output;
    }
    return { type: "loaded", value: result };
  }
}
