import { parse } from "../../ast/parse.js";
import { defaultEnv } from "../../dists/env.js";
import { RunResult } from "../../runners/BaseRunner.js";
import { Value } from "../../value/index.js";
import { vDictFromArray } from "../../value/VDict.js";
import { createModel, Model } from "./Model.js";
import { createSource, Source } from "./Source.js";
import { SqSession, withModel, withResult, withSource } from "./SqSession.js";

function getImports(model: Model): [string, string][] {
  const astR = parse(model.code, model.name);
  if (!astR.ok) {
    throw new Error(`Failed to parse import names: ${astR.value}`);
  }

  const program = astR.value;

  return program.imports.map(([file, name]) => [file.value, name.value]);
}

function getImportNames(model: Model): string[] {
  return getImports(model).map(([name]) => name);
}

async function loadModelByName(
  session: SqSession,
  name: string
): Promise<[SqSession, Model]> {
  if (!session.modelsByName[name]) {
    const code = await session.linker.loadSource(name);

    session = withModel(session, await createModel({ name, code }));
  }
  return [session, session.modelsByName[name]];
}

async function modelToSource(
  session: SqSession,
  model: Model
): Promise<[SqSession, Source]> {
  if (!session.modelIdToSourceId[model.id]) {
    const importNames = getImportNames(model);
    const dependencies: Record<string, Source> = {};
    for (const importName of importNames) {
      const resolvedName = session.linker.resolve(importName, model.name);

      let importModel: Model;
      [session, importModel] = await loadModelByName(session, resolvedName);

      let source: Source;
      [session, source] = await modelToSource(session, importModel);
      dependencies[importName] = source;
    }

    const source = await createSource({ model, dependencies });
    session = withSource(session, source);
  }
  return [session, session.sourcesById[session.modelIdToSourceId[model.id]]];
}

async function runSource(
  session: SqSession,
  source: Source
): Promise<[SqSession, RunResult]> {
  if (!session.resultsBySourceId[source.id]) {
    const imports = getImports(source.model);
    const externalsList: [string, Value][] = [];
    for (const [importName, varName] of imports) {
      const dependency = source.dependencies[importName];
      if (!dependency) {
        throw new Error(
          `Invalid source: ${source.id}, missing dependency: ${importName}`
        );
      }
      const [updatedSession, result] = await runSource(session, dependency);
      session = updatedSession;
      if (!result.ok) {
        throw result.value; // FIXME
      }
      externalsList.push([varName, result.value.exports]);
    }
    const externals = vDictFromArray(externalsList);

    const astR = parse(source.model.code, source.model.name);
    if (!astR.ok) {
      throw new Error(`Failed to parse: ${astR.value}`);
    }

    const ast = astR.value;

    const runnerOutput = await session.runner.run({
      environment: defaultEnv, // FIXME
      ast,
      externals,
      sourceId: source.model.name,
    });
    session = withResult(session, source.id, runnerOutput);
  }

  return [session, session.resultsBySourceId[source.id]];
}

export async function runModel(
  session: SqSession,
  model: Model
): Promise<[SqSession, RunResult]> {
  session = withModel(session, model);

  let source: Source;
  [session, source] = await modelToSource(session, model);

  return await runSource(session, source);
}

/**
 * TODO:
 * - [x] return updated session on each step
 * - [x] run imports recursively
 * - [ ] cache ast and expression
 * - [ ] detect recursive imports
 * - [ ] squiggle version in hash
 * - [ ] send actions to external callback
 * - [ ] environment - somewhere
 * - [ ] check error handling
 */
