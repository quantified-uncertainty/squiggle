import React, { FC, ReactNode, useEffect, useReducer } from "react";

import { SqValue, SqCalculator, SqError, result } from "@quri/squiggle-lang";
import { Env } from "@quri/squiggle-lang";

import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { SqValueWithContext, valueHasContext } from "../../lib/utility.js";

import ReactMarkdown from "react-markdown";
import { initialize, updateCode } from "./asyncActions.js";

import { useViewerContext } from "../SquiggleViewer/ViewerProvider.js";

type Props = {
  value: SqCalculator;
  environment: Env;
  settings: PlaygroundSettings;
  valueWithContext: SqValueWithContext;
  renderValue: (
    value: SqValueWithContext,
    settings: PlaygroundSettings
  ) => ReactNode;
};

export const Calculator: FC<Props> = ({
  value: calculator,
  environment,
  settings,
  renderValue,
  valueWithContext,
}) => {
  const { path } = valueWithContext.context;
  const { getSettings, dispatch } = useViewerContext();
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const itemSettings = getSettings({ path, defaults: undefined });
  const calculatorState = itemSettings.calculator;

  const init = async () => {
    await initialize({
      dispatch,
      path,
      calculator,
      environment,
    });
    forceUpdate();
  };

  useEffect(() => {
    !calculatorState && init();
  }, []);

  const handleChange =
    (name: string) =>
    async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newCode = e.target.value;

      calculatorState &&
        (await updateCode({
          dispatch,
          path,
          environment: environment,
          state: calculatorState,
          name,
          code: newCode,
          forceUpdate,
          calculator,
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
      {calculator.description && (
        <ReactMarkdown className={"prose text-sm text-slate-800 bg-opacity-60"}>
          {calculator.description}
        </ReactMarkdown>
      )}

      {calculatorState &&
        calculator.rows.map((row) => {
          const { name, description } = row;
          const { value, code } = calculatorState!.fields[name];
          const result = value;
          const resultHasInterestingError = result && !result.ok && code !== "";
          return (
            <div key={name} className="flex flex-col max-w-lg">
              <div className="text-sm font-semibold text-slate-800">{name}</div>
              {description && (
                <div className="text-sm  text-slate-600">{description}</div>
              )}
              <div className="flex-grow">
                <input
                  value={code || ""}
                  onChange={handleChange(name)}
                  placeholder={`Enter code for ${name}`}
                  className="my-2 p-2 border rounded w-full"
                />
              </div>
              <div>
                {result &&
                  // resultHasInterestingError &&
                  showSqValue(result, fieldShowSettings)}
                {!result && (
                  <div className="text-sm text-gray-500">No result</div>
                )}
              </div>
            </div>
          );
        })}
      {calculatorState?.fn.value?.ok && (
        <div>
          <div className="text-md font-bold text-slate-800">Result</div>
          {showSqValue(calculatorState.fn.value, resultSettings)}
        </div>
      )}
    </div>
  );
};
