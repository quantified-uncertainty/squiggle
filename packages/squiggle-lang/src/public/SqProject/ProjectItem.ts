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

export type ProjectItem = Readonly<{
  sourceId: string;
  source: string;
  rawParse?: result<AST, SqError>;
  expression?: result<Expression, SqError>;
  bindings: Namespace;
  result?: result<Value, SqError>;
  continues: string[];
  imports: result<ImportBinding[], SqError>;
}>;

type t = ProjectItem;

export const emptyItem = (sourceId: string): t => ({
  sourceId,
  source: "",
  bindings: NamespaceMap(),
  continues: [],
  imports: Ok([]),
});

export const touchSource = (t: t): t => {
  const r = emptyItem(t.sourceId);
  return {
    ...r,
    source: t.source,
    continues: t.continues,
    // why do we keep these?
    imports: t.imports,
  };
};

const touchRawParse = (t: t): t => {
  const r = emptyItem(t.sourceId);
  return {
    ...r,
    source: t.source,
    continues: t.continues,
    imports: t.imports,
    rawParse: t.rawParse,
  };
};

const touchExpression = (t: t): t => {
  return {
    ...t,
    source: t.source,
    continues: t.continues,
    imports: t.imports,
    rawParse: t.rawParse,
    expression: t.expression,
  };
};

const resetImports = (t: t): t => {
  return {
    ...t,
    imports: Ok([]),
  };
};

export const setSource = (t: t, source: string): t => {
  return touchSource(resetImports({ ...t, source }));
};

const setRawParse = (
  t: t,
  rawParse: NonNullable<ProjectItem["rawParse"]>
): t => {
  return touchRawParse({ ...t, rawParse });
};

const setExpression = (
  t: t,
  expression: NonNullable<ProjectItem["expression"]>
): t => {
  return touchExpression({ ...t, expression });
};

const setBindings = (t: t, bindings: Namespace): t => {
  return {
    ...t,
    bindings,
  };
};

export const setResult = (
  t: t,
  result: NonNullable<ProjectItem["result"]>
): t => {
  return {
    ...t,
    result,
  };
};

export const cleanResults = touchExpression;

export const clean = (t: t): t => {
  // FIXME - this doesn't seem to be doing anything
  return {
    ...t,
    source: t.source,
    bindings: t.bindings,
    result: t.result,
  };
};

export const getImmediateDependencies = (t: t): string[] => {
  if (!t.imports.ok) {
    return [];
  }
  return [...t.imports.value.map((i) => i.sourceId), ...t.continues];
};

export const setContinues = (t: t, continues: string[]): t =>
  touchSource({ ...t, continues });

const setImports = (t: t, imports: ProjectItem["imports"]): t => ({
  ...t,
  imports,
});

export const parseImports = (t: t, resolver: Resolver): t => {
  t = rawParse(t);
  if (!t.rawParse) {
    throw new Error("Internal logic error");
  }
  if (!t.rawParse.ok) {
    return setImports(resetImports(t), t.rawParse);
  }

  const program = t.rawParse.value;
  if (program.type !== "Program") {
    throw new Error("Expected Program as top-level AST type");
  }

  const resolvedImports: ImportBinding[] = program.imports.map(
    ([variable, file]) => ({
      variable: variable.value,
      sourceId: resolver(file.value, t.sourceId),
    })
  );

  return {
    ...t,
    imports: Ok(resolvedImports),
  };
};

export const rawParse = (t: t): t => {
  if (t.rawParse) {
    return t;
  }
  const rawParse = Result.errMap(
    parse(t.source, t.sourceId),
    (e: ParseError) => new SqError(IError.fromParseError(e))
  );
  return setRawParse(t, rawParse);
};

const buildExpression = (t: t): t => {
  t = rawParse(t);
  if (t.expression) {
    return t;
  }
  if (!t.rawParse) {
    // rawParse() guarantees that the rawParse is set
    throw new Error("Internal logic error");
  }
  const expression = Result.fmap(t.rawParse, (node) => expressionFromAst(node));
  return setExpression(t, expression);
};

const failRun = (t: t, e: SqError): t =>
  setBindings(setResult(t, Result.Error(e)), NamespaceMap());

export const run = (t: t, context: ReducerContext): t => {
  t = buildExpression(t);
  if (t.result) {
    return t;
  }

  if (!t.expression) {
    // buildExpression() guarantees that the expression is set
    throw new Error("Internal logic error");
  }

  if (!t.expression.ok) {
    return failRun(t, t.expression.value);
  }

  try {
    const [result, contextAfterEvaluation] = evaluate(
      t.expression.value,
      context
    );
    return setBindings(
      setResult(t, Ok(result)),
      contextAfterEvaluation.bindings.locals()
    );
  } catch (e: unknown) {
    return failRun(t, new SqError(IError.fromException(e)));
  }
};
