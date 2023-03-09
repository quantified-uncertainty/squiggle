import {
  Env,
  SqDistribution,
  SqDistributionTag,
  SqLambda,
  SqProject,
} from "@quri/squiggle-lang";
import { SqValue } from "@quri/squiggle-lang/src/public/SqValue";
import React, { useEffect, useMemo, useState } from "react";
import { NumberShower } from "../NumberShower";
import { SquiggleViewer } from "../SquiggleViewer";
import { Histogram } from "./Histogram";

type Choice = {
  id: string;
  name: string;
};

const useRelativeValues = (code: string) => {
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

    const choices: Choice[] = [];
    for (let choiceValue of choiceValues) {
      if (choiceValue.tag !== "Record") {
        setError(`choice should be a record, got: ${choiceValue.tag}`);
        return;
      }
      let id: string | undefined, name: string | undefined;
      for (let [k, v] of choiceValue.value.entries()) {
        if (k === "id") {
          if (v.tag !== "String") {
            setError("expected string for id");
            return;
          }
          id = v.value;
        }
        if (k === "name") {
          if (v.tag !== "String") {
            setError("expected string for name");
            return;
          }
          name = v.value;
        }
      }

      if (id === undefined) {
        setError("id field not present");
        return;
      }
      if (name === undefined) {
        setError("name field not present");
        return;
      }

      choices.push({
        id,
        name,
      });
    }

    setChoices(choices);
  }, [project, code]);

  return { error, choices, fn, project };
};

const CellError: React.FC<{ error: string }> = ({ error }) => {
  // TODO - truncate
  return <div className="text-red-500 text-xs">{error}</div>;
};

const Cell: React.FC<{ dist: SqDistribution; env: Env }> = ({ dist, env }) => {
  if (dist.tag !== SqDistributionTag.SampleSet) {
    // TODO - convert automatically?
    return <CellError error="Expected sample set" />;
  }

  const median = dist.inv(env, 0.5);

  const samples = [...dist.value().samples].sort((a, b) => a - b);
  return (
    <div className="h-8 pt-[1px] relative">
      <div className="absolute top-0 inset-x-0 text-center">
        {median.ok ? <NumberShower number={median.value} /> : null}
      </div>
      <Histogram data={samples} />
    </div>
  );
};

type Props = {
  code: string;
  showDebugViewer?: boolean;
};

export const SquiggleRelativeValues: React.FC<Props> = ({
  code,
  showDebugViewer,
}) => {
  const { error, choices, fn, project } = useRelativeValues(code);

  const renderCompare = (choice1: Choice, choice2: Choice) => {
    if (!fn) {
      return null;
    }
    const result = fn.call([choice1.id, choice2.id]);
    // return result.value.toString();
    if (!result.ok) {
      return <CellError error={result.value.toString()} />;
    }

    const value = result.value;
    if (value.tag !== "Dist") {
      return <CellError error="Expected dist" />;
    }

    return (
      <div>
        {showDebugViewer && (
          <SquiggleViewer result={result} enableLocalSettings={true} />
        )}
        <Cell dist={value.value} env={project.getEnvironment()} />
      </div>
    );
  };

  return (
    <div>
      {error && <pre className="text-red-700">{error}</pre>}
      <table className="text-xs table-fixed">
        <thead>
          <tr>
            <th />
            {choices.map((choice) => (
              <th
                key={choice.id}
                className="border border-gray-200 p-1 bg-gray-50"
              >
                <div className="w-40">{choice.name}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {choices.map((choice1, i1) => (
            <tr key={choice1.id}>
              <td
                key={0}
                className="font-bold border border-gray-200 bg-gray-50 p-1"
              >
                {choice1.name}
              </td>
              {choices.map((choice2, i2) =>
                i2 < i1 ? (
                  <td key={choice2.id} className="border border-gray-200 p-0">
                    {renderCompare(choice1, choice2)}
                  </td>
                ) : (
                  <td key={choice2.id} className="bg-gray-200" />
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
