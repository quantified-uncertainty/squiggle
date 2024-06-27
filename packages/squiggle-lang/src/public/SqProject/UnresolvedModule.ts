import { parse } from "../../ast/parse.js";
import { AST, LocationRange } from "../../ast/types.js";
import { errMap, result } from "../../utility/result.js";
import { SqCompileError, SqError } from "../SqError.js";
import { SqLinker } from "../SqLinker.js";
import { ResolvedModuleHash } from "./ResolvedModule.js";
import { getHash } from "./utils.js";

export type UnresolvedModuleHash = string;

type Import = {
  name: string;
  variable: string;
  location: LocationRange;
};

export class UnresolvedModule {
  name: string;
  code: string;
  pins: Record<string, ResolvedModuleHash>; // key is source id
  linker: SqLinker;

  private _ast?: result<AST, SqError>;

  constructor(params: {
    name: string;
    code: string;
    linker: SqLinker;
    pins?: Record<string, ResolvedModuleHash>;
  }) {
    this.name = params.name;
    this.code = params.code;
    this.linker = params.linker;
    this.pins = params.pins ?? {};
  }

  ast() {
    if (!this._ast) {
      this._ast = errMap(
        parse(this.code, this.name),
        (e) => new SqCompileError(e)
      );
    }
    return this._ast;
  }

  imports(): Import[] {
    const ast = this.ast();
    if (!ast.ok) {
      return [];
    }
    const program = ast.value;

    const resolvedImports: Import[] = [];

    for (const [file, variable] of program.imports) {
      const sourceId = this.linker.resolve(file.value, this.name);
      resolvedImports.push({
        variable: variable.value,
        name: sourceId,
        // TODO - this is used for errors, but we should use the entire import statement;
        // To fix this, we need to represent each import statement as an AST node.
        location: file.location,
      });
    }

    return resolvedImports;
  }

  hash(): UnresolvedModuleHash {
    return (
      `unresolved-${this.name}-` +
      getHash(
        JSON.stringify({
          name: this.name,
          code: this.code,
          pins: this.pins,
        })
      )
    );
  }
}
