import { BaseRunner, RunResult } from "../../runners/BaseRunner.js";
import { SqLinker } from "../SqLinker.js";
import { Model } from "./Model.js";
import { Source } from "./Source.js";

export type SqSession = {
  linker: SqLinker;
  runner: BaseRunner;
  modelsByName: Record<string, Model>;
  modelIdToSourceId: Record<string, string>;
  sourcesById: Record<string, Source>; // source.id -> source
  resultsBySourceId: Record<string, RunResult>;
};

export function withModel(session: SqSession, model: Model): SqSession {
  return {
    ...session,
    modelsByName: {
      ...session.modelsByName,
      [model.name]: model,
    },
  };
}

export function withSource(session: SqSession, source: Source): SqSession {
  return {
    ...session,
    modelIdToSourceId: {
      ...session.modelIdToSourceId,
      [source.model.id]: source.id,
    },
    sourcesById: {
      ...session.sourcesById,
      [source.id]: source,
    },
  };
}

export function withResult(
  session: SqSession,
  sourceId: string,
  result: RunResult
): SqSession {
  return {
    ...session,
    resultsBySourceId: {
      [sourceId]: result,
    },
  };
}

export function createSession(linker: SqLinker, runner: BaseRunner): SqSession {
  return {
    linker,
    runner,
    modelsByName: {},
    modelIdToSourceId: {},
    sourcesById: {},
    resultsBySourceId: {},
  };
}
