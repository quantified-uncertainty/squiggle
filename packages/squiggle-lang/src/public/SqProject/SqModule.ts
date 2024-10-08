import { analyzeAst } from "../../analysis/index.js";
import { TypedAST } from "../../analysis/types.js";
import { parse } from "../../ast/parse.js";
import { AST, LocationRange } from "../../ast/types.js";
import { Env } from "../../dists/env.js";
import { errMap, getExt, result } from "../../utility/result.js";
import {
  SqCompileError,
  SqErrorList,
  SqImportError,
  SqOtherError,
} from "../SqError.js";
import { SqLinker } from "../SqLinker.js";
import { ModulePointer, ProjectState } from "./ProjectState.js";
import { SqModuleOutput } from "./SqModuleOutput.js";
import { getHash } from "./utils.js";

export type Import = {
  path: string; // original import string in code
  name: string; // import name resolved through `linker.resolve`
  hash: string | undefined;
  variable: string;
  location: LocationRange;
};

export function importToPointer(importBinding: Import): ModulePointer {
  return {
    name: importBinding.name,
    hash: importBinding.hash,
  };
}

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
      value: SqErrorList;
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
      value: SqErrorList;
    };

type SqASTResult = result<AST, SqCompileError[]>;
type SqTypedASTResult = result<TypedAST, SqCompileError[]>;

export class SqModule {
  name: string;
  code: string;
  // key is module name, value is hash
  pins: Record<string, string>;

  private _ast?: SqASTResult;
  private _typedAst?: SqTypedASTResult;

  constructor(params: {
    name: string;
    code: string;
    pins?: Record<string, string>;
  }) {
    this.name = params.name;
    this.code = params.code;
    this.pins = params.pins ?? {};
  }

  // Parsing is done lazily but synchronously and can happen on the main thread.
  // TODO - separate imports parsing with a simplified grammar and do everything else in a worker.
  ast() {
    if (!this._ast) {
      this._ast = errMap(parse(this.code, this.name), (errors) =>
        errors.map((e) => new SqCompileError(e))
      );
    }
    return this._ast;
  }

  typedAst() {
    if (!this._typedAst) {
      const ast = this.ast();
      if (ast.ok) {
        this._typedAst = errMap(analyzeAst(ast.value), (errors) =>
          errors.map((e) => new SqCompileError(e))
        );
      } else {
        this._typedAst = ast;
      }
    }
    return this._typedAst;
  }

  // Useful when we're sure that AST is ok, e.g. when we obtain `SqModule` from `SqValueContext`.
  // Name is following the Rust conventions (https://doc.rust-lang.org/std/result/enum.Result.html#method.expect).
  expectAst(): AST {
    return getExt(this.ast());
  }

  expectTypedAst(): TypedAST {
    return getExt(this.typedAst());
  }

  getImports(linker: SqLinker): Import[] {
    const ast = this.ast();
    if (!ast.ok) {
      return [];
    }
    const program = ast.value;

    const resolvedImports: Import[] = [];

    for (const importNode of program.imports) {
      const { path, variable } = importNode;
      const name = linker.resolve(path.value, this.name);
      resolvedImports.push({
        path: path.value,
        name,
        hash: this.pins[name],
        variable: variable.value,
        location: path.location,
      });
    }

    return resolvedImports;
  }

  // TODO - cache the hash for performance
  hash(): string {
    return getHash(
      `module/${this.name}/` +
        JSON.stringify({
          name: this.name,
          code: this.code,
          pins: this.pins,
        })
    );
  }

  // Helper methods

  /**
   * The methods below are somewhat awkward and their return types are more
   * ad-hoc than I'd like (is it enough to return `{ type: "loading" }`, or do
   * we need the details about which imports are loading? for now it's enough,
   * but hard to tell if it's going to stay this way).
   *
   * By this point I was just looking for some solution for "I have a module and
   * need to check if it's ready for running" and similar problems, and I was
   * moving the code around until it ended up here.
   *
   * Passing the `state` as a parameter is also weird; these are multi-methods
   * on "module + state". Maybe they belong in `ProjectState` and not on this
   * class.
   */

  getImportModules({ state }: { state: ProjectState }): ImportModules {
    const ast = this.ast();
    if (!ast.ok) {
      return {
        type: "failed",
        value: new SqErrorList(ast.value),
      };
    }

    const result: Record<string, SqModule> = {};
    for (const importBinding of this.getImports(state.linker)) {
      const importedModuleData = state.getModuleDataByPointer(
        importToPointer(importBinding)
      );
      if (!importedModuleData || importedModuleData.type === "loading") {
        return { type: "loading" };
      }

      if (importedModuleData.type === "failed") {
        return {
          type: "failed",
          value: new SqErrorList([
            new SqImportError(
              new SqOtherError(importedModuleData.value),
              importBinding
            ),
          ]),
        };
      }

      result[importBinding.name] = importedModuleData.value;
    }
    return { type: "loaded", value: result };
  }

  getImportOutputs({
    state,
    environment,
  }: {
    state: ProjectState;
    environment: Env;
  }): ImportOutputs {
    const importModules = this.getImportModules({ state });
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
