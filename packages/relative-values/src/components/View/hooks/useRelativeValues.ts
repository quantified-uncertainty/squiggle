import { SqLambda, SqProject } from "@quri/squiggle-lang";
import { useEffect, useMemo, useState } from "react";

export const useRelativeValues = (code: string) => {
  const project = useMemo(() => SqProject.create(), []);

  const [error, setError] = useState("");
  const [fn, setFn] = useState<SqLambda | undefined>();

  useEffect(() => {
    project.setSource("main", code);

    setFn(undefined);

    const MAIN = "main";
    project.run(MAIN);

    const result = project.getResult(MAIN);
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
