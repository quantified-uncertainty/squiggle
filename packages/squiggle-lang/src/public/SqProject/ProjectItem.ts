import Worker from "web-worker";

import { AST, parse } from "../../ast/parse.js";
import { ICompileError } from "../../errors/IError.js";
import { Env, SqProject } from "../../index.js";
import * as Result from "../../utility/result.js";
import { Err, Ok, result } from "../../utility/result.js";
import { Value } from "../../value/index.js";
import { deserializeValue, serializeValue } from "../../value/serialize.js";
import { VDict, vDictFromArray } from "../../value/VDict.js";
import { SqCompileError, SqError, SqOtherError } from "../SqError.js";
import { SqLinker } from "../SqLinker.js";
import { SquiggleWorkerResponse } from "./worker.js";

// source -> ast -> imports -> result/bindings/exports

export type Externals = {
  implicitImports: VDict;
  explicitImports: VDict;
};

export type RunOutput = {
  result: Value;
  bindings: VDict;
  exports: VDict;
  externals: Externals;
};

export type Import =
  | {
      // For now, only `continues` can be flattened, but this might change in the future.
      // Also, because of this, flat imports import _all_ bindings, not just exports. In the future, we might prefer to change that,
      // and allow flat imports of exports only (for `import "foo" as *` syntax).
      type: "flat";
      sourceId: string;
    }
  | {
      type: "named";
      sourceId: string;
      variable: string;
    };

export class ProjectItem {
  private readonly sourceId: string;
  source: string;
  continues: string[];
  ast?: result<AST, SqError>;
  imports?: result<Import[], SqError>;
  output?: result<RunOutput, SqError>;

  constructor(props: { sourceId: string; source: string }) {
    this.sourceId = props.sourceId;
    this.source = props.source;
    this.continues = [];
  }

  touchSource() {
    this.ast = undefined;
    this.imports = undefined;
    this.output = undefined;
  }

  setSource(source: string) {
    this.source = source;
    this.touchSource();
  }

  private setAst(ast: NonNullable<ProjectItem["ast"]>): void {
    this.ast = ast;

    this.imports = undefined;
    this.output = undefined;
  }

  private setImports(imports: result<Import[], SqError>): void {
    this.imports = imports;

    this.output = undefined;
  }

  clean() {
    this.output = undefined;
  }

  // Get the list of all imports and continues ids.
  getDependencies(): string[] {
    if (!this.imports?.ok) {
      // Evaluation will fail later in buildInitialBindings, so it's ok.
      // It would be better if we parsed imports recursively directly during the run,
      // but it's complicated because of asyncs and separation of concerns between this module and SqProject.
      return this.continues;
    }
    return [...this.continues, ...this.imports.value.map((i) => i.sourceId)];
  }

  // Same as `continues`, but recoded to the common format.
  // Naming conventions are a bit messy, should we rename `continues` to `implicitImports` everywhere?
  getImplicitImports(): Import[] {
    const implicitImports: Import[] = [];
    for (const continueId of this.continues) {
      implicitImports.push({
        type: "flat",
        sourceId: continueId,
      });
    }
    return implicitImports;
  }

  setContinues(continues: string[]) {
    this.continues = continues;
    this.clean();
  }

  parseImports(linker: SqLinker | undefined): void {
    if (this.imports) {
      return;
    }
    this.buildAst();
    if (!this.ast) {
      throw new Error("Internal logic error");
    }
    if (!this.ast.ok) {
      this.setImports(this.ast);
      return;
    }

    const program = this.ast.value;

    const resolvedImports: Import[] = [];

    for (const [file, variable] of program.imports) {
      // TODO - this is used for errors, but we should use the entire import statement;
      // To fix this, we need to represent each import statement as an AST node.
      const location = file.location;

      if (!linker) {
        this.setImports(
          Result.Err(
            new SqCompileError(
              new ICompileError(
                "Can't use imports when linker is not configured",
                location
              )
            )
          )
        );
        return;
      }

      try {
        const sourceId = linker.resolve(file.value, this.sourceId);
        resolvedImports.push({
          type: "named",
          variable: variable.value,
          sourceId,
        });
      } catch (e) {
        // linker.resolve has failed, that's fatal
        this.setImports(
          Result.Err(
            new SqCompileError(
              new ICompileError(
                `SqLinker.resolve has failed to resolve ${file.value}`,
                location
              )
            )
          )
        );
        return;
      }
    }

    this.setImports(Ok(resolvedImports));
  }

  private buildAst(): void {
    if (this.ast) {
      return;
    }
    const ast = Result.errMap(
      parse(this.source, this.sourceId),
      (e) => new SqCompileError(e)
    );
    this.setAst(ast);
  }

  failRun(e: SqError): void {
    this.output = Result.Err(e);
  }

  async run(environment: Env, externals: Externals, project: SqProject) {
    if (this.output) {
      return;
    }

    this.buildAst();
    if (!this.ast) {
      // buildAst() guarantees that the ast is set
      throw new Error("Internal logic error");
    }

    if (!this.ast.ok) {
      this.failRun(this.ast.value);
      return;
    }

    const _externals = vDictFromArray([])
      .merge(externals.implicitImports)
      .merge(externals.explicitImports);

    const workerUrl = new URL("./worker.js", import.meta.url);
    const worker = new (Worker as any)(workerUrl, { type: "module" });

    worker.postMessage({
      environment,
      ast: this.ast.value,
      externals: serializeValue(_externals),
      sourceId: this.sourceId,
    });

    return new Promise<void>((resolve) => {
      worker.addEventListener("message", (e: any) => {
        const data: SquiggleWorkerResponse = e.data;
        if (data.type !== "result")
          throw new Error("Expected result message from worker");

        if (data.payload.ok) {
          this.output = Ok({
            result: deserializeValue(data.payload.value.result),
            bindings: deserializeValue(data.payload.value.bindings) as VDict,
            exports: deserializeValue(data.payload.value.exports) as VDict,
            externals,
          });
        } else {
          this.output = Err(new SqOtherError(data.payload.value));
        }
        worker.terminate();
        resolve();
      });
    });

    // } catch (e: unknown) {
    //   this.failRun(new SqRuntimeError(reducer.errorFromException(e), project));
    // }
  }
}
