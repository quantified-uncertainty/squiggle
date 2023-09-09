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

type Props = {
  value: SqCalculator;
  environment: Env;
  settings: PlaygroundSettings;
  renderValue: (
    value: SqValueWithContext,
    settings: PlaygroundSettings
  ) => ReactNode;
};
//calc.run([output.value.result], environment);
const runSquiggleCode = async (
  calc: SqCalculator,
  code: string,
  environment: Env
): Promise<result<SqValue, SqError>> => {
  const project = SqProject.create();
  if (environment) {
    project.setEnvironment(environment);
  }
  const sourceId = "test";
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
    value.names.forEach((name) => {
      initialCodes[name] = "40"; // Initial code value. This can be changed as needed.
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
    const fetchResults = async () => {
      const newResults: Record<string, result<SqValue, SqError> | null> = {};

      // Fetch all results
      for (const name of value.names) {
        const code = codes[name];
        const res = await runSquiggleCode(value, code, environment);
        newResults[name] = res;
      }

      // Once all results are fetched, update the state
      setCachedResults(newResults);

      // Check validity
      const allCodesAreValid = value.names.every((name) => {
        const result = newResults[name];
        return result && result.ok;
      });

      // If all codes are valid, calculate the final result
      if (allCodesAreValid) {
        const results: SqValue[] = value.names.map((name) => {
          const res = newResults[name];
          if (res && res.ok) {
            return res.value;
          } else {
            // This shouldn't happen since we've already checked if all codes are valid.
            // Just a fallback.
            throw new Error("Invalid result encountered.");
          }
        });
        const finalResult: result<SqValue, SqError> = value.run(
          results,
          environment
        );
        setFinalResult(finalResult);
      }
    };

    fetchResults();
  }, [value, codes, environment]);

  const handleChange =
    (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const newCode = e.target.value;
      setCodes((prevCodes) => ({
        ...prevCodes,
        [name]: newCode,
      }));
    };

  const showItem = (
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
      return item.value.toString();
    }
  };

  const chartHeight = 50;
  const distributionChartSettings = {
    ...settings.distributionChartSettings,
    showSummary: false,
  };
  const adjustedSettings: PlaygroundSettings = {
    ...settings,
    distributionChartSettings,
    chartHeight,
  };

  return (
    <div className="relative rounded-sm overflow-hidden border border-slate-200">
      {value.names.map((name) => (
        <div key={name}>
          <input
            value={codes[name] || ""}
            onChange={handleChange(name)}
            placeholder={`Enter code for ${name}`}
            className="my-2 p-2 border rounded"
          />
          {cachedResults[name]
            ? showItem(cachedResults[name]!, adjustedSettings)
            : "Loading..."}
        </div>
      ))}
      {finalResult && finalResult.ok && showItem(finalResult, adjustedSettings)}
    </div>
  );
};
