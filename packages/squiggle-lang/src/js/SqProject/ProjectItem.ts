import { parseIncludes as parseIncludes_ } from "./parseIncludes";
import {
  Error_,
  fromRSResult,
  Ok,
  result,
  resultMap,
  resultMapError,
} from "../types";
import { Resolver } from "./Resolver";
import { AST, parse, ParseError } from "../../ast/parse";
import { errorFromException, fromParseError } from "../../reducer/IError";
import { Expression } from "../../expression";
import * as Namespace from "../../reducer/Namespace";
import * as Bindings from "../../reducer/bindings";
import { Value } from "../../value";
import { SqError } from "../SqError";
import { expressionFromAst } from "../../ast/toExpression";
import { ReducerContext } from "../../reducer/Context";
import { evaluate } from "../../reducer";

// source -> rawParse -> includes -> expression -> bindings & result

export type ProjectItem = Readonly<{
  sourceId: string;
  source: string;
  rawParse?: result<AST, SqError>;
  expression?: result<Expression, SqError>;
  bindings: Namespace.Namespace;
  result?: result<Value, SqError>;
  continues: string[];
  includes: result<string[], SqError>; // For loader
  includeAsVariables: [string, string][]; // For linker
  directIncludes: string[];
}>;

type t = ProjectItem;

export const emptyItem = (sourceId: string): t => ({
  sourceId,
  source: "",
  bindings: Namespace.make(),
  continues: [],
  includes: Ok([]),
  directIncludes: [],
  includeAsVariables: [],
});

export const touchSource = (t: t): t => {
  const r = emptyItem(t.sourceId);
  return {
    ...r,
    source: t.source,
    continues: t.continues,
    // why do we keep these?
    includes: t.includes,
    includeAsVariables: t.includeAsVariables,
    directIncludes: t.directIncludes,
  };
};

const touchRawParse = (t: t): t => {
  const r = emptyItem(t.sourceId);
  return {
    ...r,
    source: t.source,
    continues: t.continues,
    includes: t.includes,
    includeAsVariables: t.includeAsVariables,
    directIncludes: t.directIncludes,
    rawParse: t.rawParse,
  };
};

const touchExpression = (t: t): t => {
  return {
    ...t,
    source: t.source,
    continues: t.continues,
    includes: t.includes,
    includeAsVariables: t.includeAsVariables,
    directIncludes: t.directIncludes,
    rawParse: t.rawParse,
    expression: t.expression,
  };
};

const resetIncludes = (t: t): t => {
  return {
    ...t,
    includes: Ok([]),
    includeAsVariables: [],
    directIncludes: [],
  };
};

export const setSource = (t: t, source: string): t => {
  return touchSource(resetIncludes({ ...t, source }));
};

const setRawParse = (
  t: t,
  rawParse: NonNullable<ProjectItem["rawParse"]>
): t => {
  return touchRawParse({ ...t, rawParse: rawParse });
};

const setExpression = (
  t: t,
  expression: NonNullable<ProjectItem["expression"]>
): t => {
  return touchExpression({ ...t, expression: expression });
};

const setBindings = (t: t, bindings: Namespace.Namespace): t => {
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
  if (t.includes.tag === "Error") {
    return [];
  }
  return [...t.includes.value, ...t.continues];
};

export const getPastChain = (t: t): string[] => [
  ...t.directIncludes,
  ...t.continues,
];

export const setContinues = (t: t, continues: string[]): t =>
  touchSource({ ...t, continues });

const setIncludes = (t: t, includes: ProjectItem["includes"]): t => ({
  ...t,
  includes,
});

export const parseIncludes = (t: t, resolver: Resolver): t => {
  const rRawImportAsVariables = parseIncludes_(t.source);
  if (rRawImportAsVariables.tag === "Error") {
    return setIncludes(resetIncludes(t), rRawImportAsVariables);
  } else {
    // ok
    const rawImportAsVariables = rRawImportAsVariables.value.map(
      ([variable, file]) =>
        [variable, resolver(file, t.sourceId)] as [string, string]
    );

    const includes = rawImportAsVariables.map(([_variable, file]) => file);
    const includeAsVariables = rawImportAsVariables.filter(
      ([variable, _file]) => variable !== ""
    );
    const directIncludes = rawImportAsVariables
      .filter(([variable, _file]) => variable === "")
      .map(([_variable, file]) => file);
    return {
      ...t,
      includes: Ok(includes),
      includeAsVariables,
      directIncludes,
    };
  }
};

export const rawParse = (t: t): t => {
  if (t.rawParse) {
    return t;
  }
  const rawParse = resultMapError(
    fromRSResult(parse(t.source, t.sourceId)),
    (e: ParseError) => new SqError(fromParseError(e))
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
  const expression = resultMap(t.rawParse, (node) => expressionFromAst(node));
  return setExpression(t, expression);
};

const failRun = (t: t, e: SqError): t =>
  setBindings(setResult(t, Error_(e)), Namespace.make());

export const run = (t: t, context: ReducerContext): t => {
  t = buildExpression(t);
  if (t.result) {
    return t;
  }

  if (!t.expression) {
    // buildExpression() guarantees that the expression is set
    throw new Error("Internal logic error");
  }

  if (t.expression.tag === "Error") {
    return failRun(t, t.expression.value);
  }

  try {
    const [result, contextAfterEvaluation] = evaluate(
      t.expression.value,
      context
    );
    return setBindings(
      setResult(t, Ok(result)),
      Bindings.locals(contextAfterEvaluation.bindings)
    );
  } catch (e: unknown) {
    return failRun(t, new SqError(errorFromException(e)));
  }
};
