import { AST, parse } from "../../ast/parse.js";
import { ICompileError, IRuntimeError } from "../../errors/IError.js";
import { compileAst } from "../../expression/compile.js";
import { ReducerContext } from "../../reducer/context.js";
import { ReducerFn, evaluate } from "../../reducer/index.js";
import { Bindings } from "../../reducer/stack.js";
import { ImmutableMap } from "../../utility/immutableMap.js";
import * as Result from "../../utility/result.js";
import { Ok, result } from "../../utility/result.js";
import { Value } from "../../value/index.js";
import { SqCompileError, SqError, SqRuntimeError } from "../SqError.js";
import { SqLinker } from "../SqLinker.js";

// source -> ast -> imports -> result/bindings/exports

export type RunOutput = {
  result: Value;
  bindings: Bindings;
  exports: Bindings;
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

  async run(context: ReducerContext, externals: ImmutableMap<string, Value>) {
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

    const expression = Result.errMap(
      compileAst(this.ast.value, externals),
      (e) => new SqCompileError(e)
    );

    if (!expression.ok) {
      this.failRun(expression.value);
      return;
    }

    try {
      const wrappedEvaluate = context.evaluate;
      const asyncEvaluate: ReducerFn = (expression, context) => {
        // For now, runs are sync, so this doesn't do anything, but this might change in the future.
        // For example, if we decide to yield after each statement.
        return wrappedEvaluate(expression, context);
      };

      if (expression.value.type !== "Program") {
        // mostly for TypeScript, so that we could access `expression.value.exports`
        throw new Error("Expected Program expression");
      }

      const [result, contextAfterEvaluation] = evaluate(expression.value, {
        ...context,
        evaluate: asyncEvaluate,
      });

      const bindings = contextAfterEvaluation.stack.asBindings();
      const exportNames = new Set(expression.value.value.exports);
      const exports = bindings.filter((_, key) => exportNames.has(key));
      this.output = Ok({
        result,
        bindings,
        exports,
      });
    } catch (e: unknown) {
      this.failRun(new SqRuntimeError(IRuntimeError.fromException(e)));
    }
  }
}
