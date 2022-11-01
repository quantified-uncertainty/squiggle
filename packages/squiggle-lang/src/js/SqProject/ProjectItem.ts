import { node } from "../../rescript/Reducer/Reducer_Peggy/Reducer_Peggy_Parse.gen";
import * as RSError from "../../rescript/SqError.gen";
import * as RSReducerT from "../../rescript/Reducer/Reducer_T.gen";
import * as RSReducerNamespace from "../../rescript/Reducer/Reducer_Namespace.gen";
import * as RSReducerBindings from "../../rescript/Reducer/Reducer_Bindings.gen";
import * as RSReducerExpression from "../../rescript/Reducer/Reducer_Expression/Reducer_Expression.gen";
import * as RSReducerPeggyParse from "../../rescript/Reducer/Reducer_Peggy/Reducer_Peggy_Parse.gen";
import * as RSReducerPeggyToExpression from "../../rescript/Reducer/Reducer_Peggy/Reducer_Peggy_ToExpression.gen";
import { parseIncludes as parseIncludes_ } from "./parseIncludes";
import { SqError } from "../SqError";
import { Error_, Ok, result, resultMap, resultMapError } from "../types";

export type ProjectItem = {
  source: string;
  sourceId: string;
  rawParse?: result<node, SqError>;
  expression?: result<RSReducerT.expression, SqError>;
  continuation: RSReducerT.namespace;
  result?: result<RSReducerT.value, SqError>;
  continues: string[];
  includes: result<string[], SqError>; //For loader
  includeAsVariables: [string, string][]; //For linker
  directIncludes: string[];
};

type t = ProjectItem;

export const emptyItem = (sourceId: string): t => ({
  source: "",
  sourceId,
  continuation: RSReducerNamespace.make(),
  continues: [],
  includes: Ok([]),
  directIncludes: [],
  includeAsVariables: [],
});

// source -> rawParse -> includes -> expression -> continuation -> result

const getSource = (r: t) => r.source;
const getSourceId = (r: t) => r.sourceId;
const getRawParse = (r: t) => r.rawParse;
const getExpression = (r: t) => r.expression;
export const getContinuation = (r: t) => r.continuation;
export const getResult = (r: t) => r.result;

export const getContinues = (r: t) => r.continues;
export const getIncludes = (r: t) => r.includes;
export const getDirectIncludes = (r: t) => r.directIncludes;
export const getIncludesAsVariables = (r: t) => r.includeAsVariables;

export const touchSource = (t: t): t => {
  const r = emptyItem(getSourceId(t));
  return {
    ...r,
    source: getSource(t),
    continues: getContinues(t),
    includes: getIncludes(t),
    includeAsVariables: getIncludesAsVariables(t),
    directIncludes: getDirectIncludes(t),
  };
};

const touchRawParse = (t: t): t => {
  const r = emptyItem(getSourceId(t));
  return {
    ...r,
    source: getSource(t),
    continues: getContinues(t),
    includes: getIncludes(t),
    includeAsVariables: getIncludesAsVariables(t),
    directIncludes: getDirectIncludes(t),
    rawParse: getRawParse(t),
  };
};

const touchExpression = (t: t): t => {
  return {
    ...t,
    source: getSource(t),
    continues: getContinues(t),
    includes: getIncludes(t),
    includeAsVariables: getIncludesAsVariables(t),
    directIncludes: getDirectIncludes(t),
    rawParse: getRawParse(t),
    expression: getExpression(t),
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

export const setContinuation = (
  t: t,
  continuation: RSReducerT.namespace
): t => {
  return {
    ...t,
    continuation,
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
    source: getSource(t),
    continuation: getContinuation(t),
    result: getResult(t),
  };
};

export const getImmediateDependencies = (t: t): string[] => {
  if (t.includes.tag === "Error") {
    return [];
  }
  return [...t.includes.value, ...getContinues(t)];
};

export const getPastChain = (t: t): string[] => [
  ...getDirectIncludes(t),
  ...getContinues(t),
];

export const setContinues = (t: t, continues: string[]): t =>
  touchSource({ ...t, continues });

export const removeContinues = (t: t): t =>
  touchSource({ ...t, continues: [] });

const setIncludes = (
  t: t,
  includes: NonNullable<ProjectItem["includes"]>
): t => ({
  ...t,
  includes,
});

const setImportAsVariables = (
  t: t,
  includeAsVariables: NonNullable<ProjectItem["includeAsVariables"]>
): t => ({
  ...t,
  includeAsVariables,
});

const setDirectImports = (t: t, directIncludes: string[]): t => ({
  ...t,
  directIncludes,
});

export const parseIncludes = (t: t): t => {
  const rRawImportAsVariables = parseIncludes_(getSource(t));
  if (rRawImportAsVariables.tag === "Error") {
    return setIncludes(resetIncludes(t), rRawImportAsVariables);
  } else {
    const rawImportAsVariables = rRawImportAsVariables.value;
    // ok
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
  if (getRawParse(t)) {
    return t;
  }
  const rawParse = resultMapError(
    RSReducerPeggyParse.parse(getSource(t), t.sourceId),
    (e: RSReducerPeggyParse.ParseError_t) =>
      new SqError(RSError.fromParseError(e))
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
  const expression = resultMap(t.rawParse, (node) =>
    RSReducerPeggyToExpression.fromNode(node)
  );
  return setExpression(t, expression);
};

const failRun = (t: t, e: SqError): t =>
  setContinuation(setResult(t, Error_(e)), RSReducerNamespace.make());

export const run = (t: t, context: RSReducerT.context): t => {
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
    const [result, contextAfterEvaluation] = RSReducerExpression.evaluate(
      t.expression.value,
      context
    );
    return setContinuation(
      setResult(t, Ok(result)),
      RSReducerBindings.locals(contextAfterEvaluation.bindings)
    );
  } catch (e: unknown) {
    // genType doesn't support exception types, so RSError.fromException is impossible to call directly
    // this is a temporary hack while we transition from Rescript
    if (
      typeof e === "object" &&
      (e as any).RE_EXN_ID &&
      (e as any).RE_EXN_ID.startsWith("SqError-QuriSquiggleLang.SqException/")
    ) {
      // looks like SqError.SqException, let's unwrap it
      const error: RSError.t = (e as any)._1;
      return failRun(t, new SqError(error));
    } else {
      // oh well; hope this doesn't happen too often
      return failRun(t, SqError.createOtherError(String(e)));
    }
  }
};
