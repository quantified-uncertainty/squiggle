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

type T = ProjectItem;

export function emptyItem(sourceId: string): T {
  return {
    sourceId,
    source: "",
    bindings: NamespaceMap(),
    continues: [],
    imports: Ok([]),
  };
}

export function touchSource(t: T): T {
  const r = emptyItem(t.sourceId);
  return {
    ...r,
    source: t.source,
    continues: t.continues,
    // why do we keep these?
    imports: t.imports,
  };
}

function touchRawParse(t: T): T {
  const r = emptyItem(t.sourceId);
  return {
    ...r,
    source: t.source,
    continues: t.continues,
    imports: t.imports,
    rawParse: t.rawParse,
  };
}

function touchExpression(t: T): T {
  return {
    ...t,
    source: t.source,
    continues: t.continues,
    imports: t.imports,
    rawParse: t.rawParse,
    expression: t.expression,
  };
}

function resetImports(t: T): T {
  return {
    ...t,
    imports: Ok([]),
  };
}

export function setSource(t: T, source: string): T {
  return touchSource(resetImports({ ...t, source }));
}

function setRawParse(t: T, rawParse: NonNullable<ProjectItem["rawParse"]>): T {
  return touchRawParse({ ...t, rawParse });
}

function setExpression(
  t: T,
  expression: NonNullable<ProjectItem["expression"]>
): T {
  return touchExpression({ ...t, expression });
}

function setBindings(t: T, bindings: Namespace): T {
  return {
    ...t,
    bindings,
  };
}

export function setResult(t: T, result: NonNullable<ProjectItem["result"]>): T {
  return {
    ...t,
    result,
  };
}

export const cleanResults = touchExpression;

export function clean(t: T): T {
  // FIXME - this doesn't seem to be doing anything
  return {
    ...t,
    source: t.source,
    bindings: t.bindings,
    result: t.result,
  };
}

export function getImmediateDependencies(t: T): string[] {
  if (!t.imports.ok) {
    return [];
  }
  return [...t.imports.value.map((i) => i.sourceId), ...t.continues];
}

export function setContinues(t: T, continues: string[]): T {
  return touchSource({ ...t, continues });
}

function setImports(t: T, imports: ProjectItem["imports"]): T {
  return {
    ...t,
    imports,
  };
}

export function parseImports(t: T, resolver: Resolver): T {
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
}

export function rawParse(t: T): T {
  if (t.rawParse) {
    return t;
  }
  const rawParse = Result.errMap(
    parse(t.source, t.sourceId),
    (e: ParseError) => new SqError(IError.fromParseError(e))
  );
  return setRawParse(t, rawParse);
}

function buildExpression(t: T): T {
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
}

function failRun(t: T, e: SqError): T {
  return {
    ...t,
    result: Result.Error(e),
    bindings: NamespaceMap(),
  };
}

export function run(t: T, context: ReducerContext): T {
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
    return {
      ...t,
      result: Ok(result),
      bindings: contextAfterEvaluation.bindings.locals(),
    };
  } catch (e: unknown) {
    return failRun(t, new SqError(IError.fromException(e)));
  }
}
