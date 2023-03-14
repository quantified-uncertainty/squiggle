import { SqLambda, SqProject, sq } from "@quri/squiggle-lang";
import { useEffect, useMemo, useState } from "react";

const wrapper = sq`
{|x, y|
  dist = fn(x, y) -> SampleSet.fromDist
  {
    dist: dist,
    median: inv(dist, 0.5),
    min: inv(dist, 0.05),
    max: inv(dist, 0.95),
    db: 10 * (dist -> log10 -> stdev)
  }
}
`;

export const useRelativeValues = (code: string) => {
  const project = useMemo(() => {
    const project = SqProject.create();
    project.setSource("wrapper", wrapper);
    project.setContinues("wrapper", ["model"]);

    return project;
  }, []);

  const [error, setError] = useState("");
  const [fn, setFn] = useState<SqLambda | undefined>();

  useEffect(() => {
    setFn(undefined);

    project.setSource("model", code);
    project.run("wrapper");
    const result = project.getResult("wrapper");

    if (!result.ok) {
      setError(
        `Failed to evaluate Squiggle code: ${result.value.toStringWithStackTrace()}`
      );
      return;
    }

    if (result.value.tag !== "Lambda") {
      setError(`Expected a function as result, got: ${result.value.tag}`);
      return;
    }
    setFn(result.value.value);
  }, [project, code]);

  return { error, fn, project };
};
