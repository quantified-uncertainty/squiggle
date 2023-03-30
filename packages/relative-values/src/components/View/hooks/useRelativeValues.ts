import { getModelCode, Model } from "@/model/utils";
import { sq, SqProject } from "@quri/squiggle-lang";
import { useMemo } from "react";

import { RVStorage } from "@/values/RVStorage";
import { jsonData } from "../../../values/SCache";

const wrapper = sq`
{|x, y|
  dist = fn(x, y) -> SampleSet.fromDist
  {
    dist: dist,
    median: inv(dist, 0.5),
    min: inv(dist, 0.05),
    max: inv(dist, 0.95),
    db: 10 * (SampleSet.map(dist, abs) -> log10 -> stdev)
  }
}
`;

export const useRelativeValues = (
  id: string | undefined,
  model: Model | undefined
) => {
  const project = useMemo(() => {
    const project = SqProject.create();
    project.setSource("wrapper", wrapper);
    project.setContinues("wrapper", ["model"]);

    return project;
  }, []);

  const code = useMemo(() => {
    if (!model) {
      return undefined;
    }
    return getModelCode(model);
  }, [model]);

  const { rv, error } = useMemo(() => {
    if (code === undefined) {
      // no model selected
      return { error: "" };
    }

    project.setSource("model", code);
    project.run("wrapper");
    const result = project.getResult("wrapper");

    if (!result.ok) {
      return {
        error: `Failed to evaluate Squiggle code: ${result.value.toStringWithStackTrace()}`,
      };
    }

    if (result.value.tag !== "Lambda") {
      return {
        error: `Expected a function as result, got: ${result.value.tag}`,
      };
    }
    console.log("HIHIHI", id);
    let cache = jsonData
      .flatMap((r) => r.models)
      .find((r) => model && r.name == model.title);
    if (!cache) {
      console.log(
        jsonData,
        id,
        jsonData.flatMap((r) => r.models)
      );
      return { error: "AAdddG" };
    }
    return {
      error: "",
      rv: new RVStorage(result.value.value, cache),
    };
  }, [project, code]);

  return { error, rv };
};
