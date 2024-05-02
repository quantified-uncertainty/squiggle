import { hash } from "./utils.js";

// similar to `ModelRevision` in Hub
export type Model = {
  id: string; // hash of contents
  name: string; // user-facing name, part of model identity because it can be included in stack traces
  code: string;
  // TODO - localEnv (different from `globalEnv` if we keep that, but should include per-source seed and maybe other stuff)
  // TODO - squiggle version?
};

async function getModelId(model: Omit<Model, "id">) {
  return hash(
    JSON.stringify({
      name: model.name,
      code: model.code,
    })
  );
}

export async function createModel(model: Omit<Model, "id">): Promise<Model> {
  return {
    id: await getModelId(model),
    ...model,
  };
}
