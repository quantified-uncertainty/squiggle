import { Model } from "@/model/utils";
import { jsonData } from "@/values/cache";
import { RVStorage } from "@/values/RVStorage";

// TODO: doesn't have to be a hook, and changing it into a static method on RVStorage would help with `model: undefined` case
export const useRelativeValues = (model: Model | undefined) => {
  let cache = jsonData
    .flatMap((r) => r.models)
    .find((r) => model && r.id == model.id);
  if (!model) {
    return { error: "No model specified" };
  }
  if (!cache) {
    return { error: "Data not in cache" };
  }
  return {
    error: "",
    rv: new RVStorage(model, cache),
  };
};
