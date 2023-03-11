import { SqLambda, SqProject, SqRecord } from "@quri/squiggle-lang";
import { useEffect, useMemo, useState } from "react";
import { Choice, Clusters } from "./types";

export const useRelativeValues = (code: string) => {
  const project = useMemo(() => SqProject.create(), []);

  const [error, setError] = useState("");
  const [choices, setChoices] = useState<Choice[]>([]);
  const [fn, setFn] = useState<SqLambda | undefined>();

  useEffect(() => {
    project.setSource("main", code);

    setFn(undefined);
    setChoices([]);

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

    const bindings = project.getBindings(MAIN);

    let choicesValue = bindings.get("choices");

    if (!choicesValue) {
      setError(`choices should be defined`);
      return;
    }
    if (choicesValue.tag !== "Array") {
      setError(`choices should be an array, got: ${choicesValue.tag}`);
      return;
    }
    const choiceValues = choicesValue.value.getValues();

    const choices: Choice[] = [];
    for (let choiceValue of choiceValues) {
      if (choiceValue.tag !== "Record") {
        setError(`choice should be a record, got: ${choiceValue.tag}`);
        return;
      }

      const getStringValue = (record: SqRecord, key: string) => {
        const value = record.get(key);
        if (value?.tag !== "String") {
          return;
        }
        return value.value;
      };
      const id = getStringValue(choiceValue.value, "id");
      const name = getStringValue(choiceValue.value, "name");
      if (id === undefined) {
        setError("id field not found");
        return;
      }
      if (name === undefined) {
        setError("name field not found");
        return;
      }

      choices.push({
        id,
        name,
        clusterId: id.startsWith("quri_papers_") ? "papers" : "software",
      });
    }

    setChoices(choices);
  }, [project, code]);

  // TODO
  const clusters: Clusters = {
    papers: {
      name: "Papers",
      color: "#DB828C",
    },
    software: {
      name: "Software",
      color: "#5D8CD3",
    },
  };

  return { error, choices, clusters, fn, project };
};
