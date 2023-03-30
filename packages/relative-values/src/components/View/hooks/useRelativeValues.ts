import { getModelCode, Model } from "@/model/utils";
import { RVStorage } from "@/values/RVStorage";
import { jsonData } from "../../../values/SCache";

export const useRelativeValues = (
  id: string | undefined,
  model: Model | undefined
) => {
  let cache = jsonData
    .flatMap((r) => r.models)
    .find((r) => model && r.name == model.title);
  if (!cache) {
    return { error: "Data not in cache" };
  }
  return {
    error: "",
    rv: new RVStorage(cache),
  };
};
