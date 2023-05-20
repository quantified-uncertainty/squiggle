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

// source -> rawParse -> imports -> expression -> bindings & result

export type ImportBinding = {
  sourceId: string;
  variable: string;
};

export class ProjectItem {
  private readonly sourceId: string;
  source: string;
  continues: string[];
  rawParse?: result<AST, SqError>;
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
    this.rawParse = undefined;
    this.imports = undefined;
    this.expression = undefined;
    this.bindings = undefined;
    this.result = undefined;
  }

  setSource(source: string) {
    this.source = source;
    return this.touchSource();
  }

  private setRawParse(rawParse: NonNullable<ProjectItem["rawParse"]>): void {
    this.rawParse = rawParse;

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
      // FIXME
      return this.continues;
    }
    return [...this.imports.value.map((i) => i.sourceId), ...this.continues];
  }

  setContinues(continues: string[]) {
    this.continues = continues;
    return this.clean();
  }

  parseImports(resolver: Resolver): void {
    if (this.imports) {
      return;
    }
    this.buildRawParse();
    if (!this.rawParse) {
      throw new Error("Internal logic error");
    }
    if (!this.rawParse.ok) {
      this.setImports(this.rawParse);
      return;
    }

    const program = this.rawParse.value;
    if (program.type !== "Program") {
      throw new Error("Expected Program as top-level AST type");
    }

    const resolvedImports: ImportBinding[] = program.imports.map(
      ([variable, file]) => ({
        variable: variable.value,
        sourceId: resolver(file.value, this.sourceId),
      })
    );

    this.setImports(Ok(resolvedImports));
  }

  private buildRawParse(): void {
    if (this.rawParse) {
      return;
    }
    const rawParse = Result.errMap(
      parse(this.source, this.sourceId),
      (e: ParseError) => new SqError(IError.fromParseError(e))
    );
    this.setRawParse(rawParse);
  }

  private buildExpression(): void {
    this.buildRawParse();
    if (this.expression) {
      return;
    }
    if (!this.rawParse) {
      // rawParse() guarantees that the rawParse is set
      throw new Error("Internal logic error");
    }
    const expression = Result.fmap(this.rawParse, (node) =>
      expressionFromAst(node)
    );
    this.setExpression(expression);
  }

  failRun(e: SqError): void {
    this.result = Result.Error(e);
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
      return this.failRun(this.expression.value);
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
