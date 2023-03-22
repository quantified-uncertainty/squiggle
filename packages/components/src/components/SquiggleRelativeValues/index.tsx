import { SqLambda, SqProject } from "@quri/squiggle-lang";
import { SqStringValue, SqValue } from "@quri/squiggle-lang/src/public/SqValue";
import React, { useEffect, useMemo, useState } from "react";
import { SquiggleViewer } from "../SquiggleViewer";

const useRelativeValues = (code: string) => {
  const project = useMemo(() => SqProject.create(), []);

  const [error, setError] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
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

    let choicesValue: SqValue | undefined;

    for (let [k, v] of bindings.entries()) {
      if (k === "choices") {
        choicesValue = v;
      }
    }

    if (!choicesValue) {
      setError(`choices should be defined`);
      return;
    }
    if (choicesValue.tag !== "Array") {
      setError(`choices should be an array, got: ${choicesValue.tag}`);
      return;
    }
    const choiceValues = choicesValue.value.getValues();

    setChoices(
      choiceValues
        // TODO: we should report non-string values as errors instead
        .filter((value): value is SqStringValue => value.tag === "String")
        .map((value) => value.value)
    );
  }, [project, code]);

  return { error, choices, fn };
};

type Props = {
  code: string;
};

export const SquiggleRelativeValues: React.FC<Props> = ({ code }) => {
  const { error, choices, fn } = useRelativeValues(code);

  const renderCompare = (choice1: string, choice2: string) => {
    if (!fn) {
      return null;
    }
    const result = fn.call([choice1, choice2]);
    return result.value.toString();
    // return <SquiggleViewer result={result} />;
  };

  return (
    <div>
      {error && <pre className="text-red-700">{error}</pre>}
      <table className="text-xs">
        <thead>
          <th />
          {choices.map((choice2) => (
            <th key={choice2} className="border border-gray-200 p-1">
              {choice2}
            </th>
          ))}
        </thead>
        <tbody>
          {choices.map((choice1) => (
            <tr key={choice1}>
              <td key={0} className="font-bold border border-gray-200 p-1">
                {choice1}
              </td>
              {choices.map((choice2) => (
                <td key={choice2} className="border border-gray-200 p-1">
                  {renderCompare(choice1, choice2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
