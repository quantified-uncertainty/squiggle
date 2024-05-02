import { Model } from "./Model.js";
import { hash } from "./utils.js";

// `ModelRevisionWithRecursivelyResolvedDependencies`
export type Source = {
  id: string; // hash of contents
  model: Model;
  dependencies: Record<string, Source>; // map from import name to imported source.
};

async function getSourceId(source: Omit<Source, "id">) {
  return hash(
    JSON.stringify({
      code: source.model.code,
      dependencies: Object.keys(source.dependencies)
        .sort()
        .map((key) => source.dependencies[key].id),
    })
  );
}

export async function createSource(
  source: Omit<Source, "id">
): Promise<Source> {
  return {
    id: await getSourceId(source),
    ...source,
  };
}
