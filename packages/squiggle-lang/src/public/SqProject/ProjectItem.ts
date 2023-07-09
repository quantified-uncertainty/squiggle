import { AST, parse } from "../../ast/parse.js";
import { IRuntimeError } from "../../errors/IError.js";
import { compileAst } from "../../expression/compile.js";
import { ReducerContext } from "../../reducer/context.js";
import { ReducerFn, evaluate } from "../../reducer/index.js";
import { Bindings } from "../../reducer/stack.js";
import { ImmutableMap } from "../../utility/immutableMap.js";
import * as Result from "../../utility/result.js";
import { Ok, result } from "../../utility/result.js";
import { Value } from "../../value/index.js";
import {
  SqCompileError,
  SqError,
  SqOtherError,
  SqRuntimeError,
} from "../SqError.js";
import { Resolver } from "./Resolver.js";

// source -> ast -> imports -> bindings & result

export type RunOutput = {
  result: Value;
  bindings: Bindings;
};

export type ImportBinding = {
  sourceId: string;
  variable: string;
};

export class ProjectItem {
  private readonly sourceId: string;
  source: string;
  continues: string[];
  ast?: result<AST, SqError>;
  imports?: result<ImportBinding[], SqError>;
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

  private setImports(imports: result<ImportBinding[], SqError>): void {
    this.imports = imports;

    this.output = undefined;
  }

  clean() {
    this.output = undefined;
  }

  getDependencies(): string[] {
    if (!this.imports?.ok) {
      // Evaluation will fail later in buildInitialBindings, so it's ok.
      // It would be better if we parsed imports recursively directly during the run,
      // but it's complicated because of asyncs and separation of concerns between this module, SqProject and Topology.
      return this.continues;
    }
    return [...this.imports.value.map((i) => i.sourceId), ...this.continues];
  }

  setContinues(continues: string[]) {
    this.continues = continues;
    this.clean();
  }

  parseImports(resolver: Resolver | undefined): void {
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
    if (program.type !== "Program") {
      throw new Error("Expected Program as top-level AST type");
    }

    if (!program.imports.length) {
      this.setImports(Ok([]));
      return;
    }

    if (!resolver) {
      this.setImports(
        Result.Err(
          new SqOtherError("Can't use imports when resolver is not configured")
        )
      );
      return;
    }

    const resolvedImports: ImportBinding[] = program.imports.map(
      ([file, variable]) => ({
        variable: variable.value,
        sourceId: resolver(file.value, this.sourceId),
      })
    );

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
        return wrappedEvaluate(expression, context);
      };

      const [result, contextAfterEvaluation] = evaluate(expression.value, {
        ...context,
        evaluate: asyncEvaluate,
      });
      this.output = Ok({
        result,
        bindings: contextAfterEvaluation.stack.asBindings(),
      });
    } catch (e: unknown) {
      this.failRun(new SqRuntimeError(IRuntimeError.fromException(e)));
    }
  }
}
