import { AST, parse } from "../../ast/parse.js";
import { Env } from "../../dists/env.js";
import { ICompileError } from "../../errors/IError.js";
import { RunOutput, RunParams } from "../../runners/BaseRunner.js";
import * as Result from "../../utility/result.js";
import { Err, Ok, result } from "../../utility/result.js";
import { VDict, vDictFromArray } from "../../value/VDict.js";
import { SqCompileError, SqError, wrapError } from "../SqError.js";
import { SqLinker } from "../SqLinker.js";
import { SqProject } from "./index.js";

// source -> ast -> imports -> runOutput

export type Externals = {
  implicitImports: VDict;
  explicitImports: VDict;
};

// Every time we run the item and cache its `ProjectItemOutput`, we also store the context that was used for that run.
// This context is useful later for constructing `SqOutput`, and also for `SqValueContext`.
// This type is similar to `RunParams` from the runners APIs, but has enough differences to be separate.
type RunContext = {
  ast: AST;
  sourceId: string;
  source: string;
  environment: Env;
  externals: Externals;
};

export type ProjectItemOutput = {
  context: RunContext;
  runOutput: RunOutput;
};

export type ProjectItemOutputResult = result<ProjectItemOutput, SqError>;

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
  output?: ProjectItemOutputResult;

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
          Err(
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
          Err(
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
    this.output = Err(e);
  }

  async run(environment: Env, externals: Externals, project: SqProject) {
    // will be set again by the end of this method, unless it throws
    this.output = undefined;

    // This part usually won't be necessary: by the time we get to
    // `ProjectItem.run`, imports must be parsed and passed as `externals` by
    // `SqProject`, so AST is already present.
    // Still, it gives us a bit better guarantees that this class will do the
    // right thing.
    this.buildAst();
    if (!this.ast) {
      // buildAst() guarantees that the ast is set
      throw new Error("Internal logic error");
    }
    if (!this.ast.ok) {
      this.output = Err(this.ast.value);
      return;
    }
    const ast = this.ast.value;

    const context: RunContext = {
      ast,
      sourceId: this.sourceId,
      source: this.source,
      environment,
      externals,
    };

    const runParams: RunParams = {
      ast,
      environment,
      externals: vDictFromArray([])
        .merge(externals.implicitImports)
        .merge(externals.explicitImports),
    };

    const runResult = await project.runner.run(runParams);

    this.output = Result.fmap2(
      runResult,
      (value) => ({
        runOutput: value,
        context,
      }),
      (err) => wrapError(err, project)
    );
  }
}
