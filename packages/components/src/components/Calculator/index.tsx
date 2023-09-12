import React, { FC, ReactNode, useState, useEffect } from "react";

import {
  SqValue,
  SqCalculator,
  SqError,
  SqProject,
  result,
} from "@quri/squiggle-lang";
import { Env } from "@quri/squiggle-lang";

import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { SqValueWithContext, valueHasContext } from "../../lib/utility.js";

import ReactMarkdown from "react-markdown";
import _ from "lodash";

type Props = {
  value: SqCalculator;
  environment: Env;
  settings: PlaygroundSettings;
  renderValue: (
    value: SqValueWithContext,
    settings: PlaygroundSettings
  ) => ReactNode;
};

const runSquiggleCode = async (
  calc: SqCalculator,
  code: string,
  environment: Env
): Promise<result<SqValue, SqError>> => {
  const project = SqProject.create();
  if (environment) {
    project.setEnvironment(environment);
  }
  const sourceId = "calculator";
  project.setSource(sourceId, code);
  await project.run(sourceId);
  const output = project.getOutput(sourceId);
  if (output.ok) {
    const result: result<SqValue, SqError> = {
      ok: true,
      value: output.value.result,
    };
    return result;
  } else {
    return output;
  }
};

export const Calculator: FC<Props> = ({
  value,
  environment,
  settings,
  renderValue,
}) => {
  const [codes, setCodes] = useState<Record<string, string>>(() => {
    const initialCodes: Record<string, string> = {};
    value.rows.forEach((row) => {
      initialCodes[row.name] = row.default; // Initial code value. This can be changed as needed.
    });
    return initialCodes;
  });

  const [cachedResults, setCachedResults] = useState<
    Record<string, result<SqValue, SqError> | null>
  >({});

  const [finalResult, setFinalResult] = useState<result<
    SqValue,
    SqError
  > | null>();

  useEffect(() => {
    const fetchUpdatedResults = async (currentCodes, currentCachedResults) => {
      const newResults: Record<string, result<SqValue, SqError> | null> = {};

      for (const row of value.rows) {
        const code = currentCodes[row.name];
        const result = currentCachedResults[row.name];
        const alreadyCached =
          result?.ok && result.value?.context?.source === code;
        if (!alreadyCached) {
          const res = await runSquiggleCode(value, code, environment);
          newResults[row.name] = res;
        }
      }

      return newResults;
    };
    const updateResults = async () => {
      const newResults = await fetchUpdatedResults(codes, cachedResults); // Use cachedResults here

      if (_.isEmpty(newResults)) {
        return;
      }

      const updatedResults = _.merge(newResults, cachedResults); // Merge in cachedResults here
      setCachedResults(updatedResults);

      const allCodesAreValid = value.rows.every((row) => {
        const result = newResults[row.name];
        return result && result.ok;
      });

      if (allCodesAreValid) {
        const results: SqValue[] = value.rows.map((row) => {
          const res = newResults[row.name];
          if (res && res.ok) {
            return res.value;
          } else {
            throw new Error("Invalid result encountered.");
          }
        });
        const finalResult: result<SqValue, SqError> = value.run(
          results,
          environment
        );
        setFinalResult(finalResult);
      } else {
        setFinalResult(null);
      }
    };

    updateResults();
  }, [value, codes, environment]); // Include cachedResults back as a dependency

  const handleChange =
    (name: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newCode = e.target.value;
      setCodes((prevCodes) => ({
        ...prevCodes,
        [name]: newCode,
      }));
    };

  const showSqValue = (
    item: result<SqValue, SqError>,
    settings: PlaygroundSettings
  ) => {
    if (item.ok) {
      const value = item.value;
      if (valueHasContext(value)) {
        return renderValue(value, settings);
      } else {
        return value.toString();
      }
    } else {
      return (
        <div className="text-sm text-red-800 text-opacity-70">
          {item.value.toString()}
        </div>
      );
    }
  };

  const fieldShowSettings: PlaygroundSettings = {
    ...settings,
    distributionChartSettings: {
      ...settings.distributionChartSettings,
      showSummary: false,
    },
    chartHeight: 30,
  };

  const resultSettings: PlaygroundSettings = {
    ...settings,
    chartHeight: 200,
  };

  return (
    <div className="relative space-y-4">
      {value.description && (
        <ReactMarkdown className={"prose text-sm text-slate-800 bg-opacity-60"}>
          {value.description}
        </ReactMarkdown>
      )}

      {value.rows.map((row) => {
        const { name, description } = row;
        const result = cachedResults[row.name];
        const code = codes[name];
        const resultHasInterestingError = result && !result.ok && code !== "";
        return (
          <div key={name} className="flex flex-col max-w-lg">
            <div className="text-sm font-semibold text-slate-800">{name}</div>
            {description && (
              <div className="text-sm  text-slate-600">{description}</div>
            )}
            <div className="flex-grow">
              <input
                value={codes[name] || ""}
                onChange={handleChange(name)}
                placeholder={`Enter code for ${name}`}
                className="my-2 p-2 border rounded w-full"
              />
            </div>
            <div>
              {result &&
                resultHasInterestingError &&
                showSqValue(result, fieldShowSettings)}
              {!result && (
                <div className="text-sm text-gray-500">No result</div>
              )}
            </div>
          </div>
        );
      })}
      {finalResult?.ok && (
        <div>
          <div className="text-md font-bold text-slate-800">Result</div>
          {showSqValue(finalResult, resultSettings)}
        </div>
      )}
    </div>
  );
};
