import { AST, ParseError, parse } from "../../ast/parse.js";
import { expressionFromAst } from "../../ast/toExpression.js";
import { Expression } from "../../expression/index.js";
import { ReducerContext } from "../../reducer/Context.js";
import { IError } from "../../reducer/IError.js";
import { Namespace, NamespaceMap } from "../../reducer/bindings.js";
import { evaluate } from "../../reducer/index.js";
import * as Result from "../../utility/result.js";
import { Ok, result } from "../../utility/result.js";
import { Value } from "../../value/index.js";
import { SqError } from "../SqError.js";
import { Resolver } from "./Resolver.js";

// source -> ast -> imports -> expression -> bindings & result

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
  expression?: result<Expression, SqError>;
  bindings?: Namespace;
  result?: result<Value, SqError>;

  constructor(props: { sourceId: string; source: string }) {
    this.sourceId = props.sourceId;
    this.source = props.source;
    this.continues = [];
  }

  touchSource() {
    this.ast = undefined;
    this.imports = undefined;
    this.expression = undefined;
    this.bindings = undefined;
    this.result = undefined;
  }

  setSource(source: string) {
    this.source = source;
    this.touchSource();
  }

  private setAST(ast: NonNullable<ProjectItem["ast"]>): void {
    this.ast = ast;

    this.imports = undefined;
    this.expression = undefined;
    this.result = undefined;
    this.bindings = undefined;
  }

  private setExpression(
    expression: NonNullable<ProjectItem["expression"]>
  ): void {
    this.expression = expression;

    this.result = undefined;
    this.bindings = undefined;
  }

  private setImports(imports: result<ImportBinding[], SqError>): void {
    this.imports = imports;

    this.expression = undefined;
    this.result = undefined;
    this.bindings = undefined;
  }

  clean() {
    this.result = undefined;
    this.bindings = undefined;
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
    this.buildAST();
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
          new SqError(
            IError.other("Can't use imports when resolver is not configured")
          )
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

  private buildAST(): void {
    if (this.ast) {
      return;
    }
    const ast = Result.errMap(
      parse(this.source, this.sourceId),
      (e: ParseError) => new SqError(IError.fromParseError(e))
    );
    this.setAST(ast);
  }

  private buildExpression(): void {
    this.buildAST();
    if (this.expression) {
      return;
    }
    if (!this.ast) {
      // buildAST() guarantees that the ast is set
      throw new Error("Internal logic error");
    }
    const expression = Result.fmap(this.ast, (node) => expressionFromAst(node));
    this.setExpression(expression);
  }

  failRun(e: SqError): void {
    this.result = Result.Err(e);
    this.bindings = NamespaceMap();
  }

  run(context: ReducerContext) {
    this.buildExpression();
    if (this.result) {
      return;
    }

    if (!this.expression) {
      // buildExpression() guarantees that the expression is set
      throw new Error("Internal logic error");
    }

    if (!this.expression.ok) {
      this.failRun(this.expression.value);
      return;
    }

    try {
      const [result, contextAfterEvaluation] = evaluate(
        this.expression.value,
        context
      );
      this.result = Ok(result);
      this.bindings = contextAfterEvaluation.bindings.locals();
    } catch (e: unknown) {
      this.failRun(new SqError(IError.fromException(e)));
    }
  }
}
