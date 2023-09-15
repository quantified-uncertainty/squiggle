import React, { FC, ReactNode, useEffect, useReducer, useState } from "react";

import {
  SqValue,
  SqCalculator,
  SqError,
  result,
  SqValuePath,
} from "@quri/squiggle-lang";
import { Env } from "@quri/squiggle-lang";

import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { SqValueWithContext, valueHasContext } from "../../lib/utility.js";

import ReactMarkdown from "react-markdown";
import { initialize, updateCode } from "./asyncActions.js";

import { Action, useViewerContext } from "../SquiggleViewer/ViewerProvider.js";
import { StyledInput } from "@quri/ui";
import {
  CalculatorAction,
  CalculatorState,
  calculatorReducer,
  hasSameCalculator,
  initialCalculatorState,
} from "./calculatorReducer.js";

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

//We backup the calculator state in the viewer context, for when the user navigates away and back
const adjustedReducer =
  (path: SqValuePath, viewerContextDispatch: (action: Action) => void) =>
  (state: CalculatorState, action: CalculatorAction) => {
    const newState = calculatorReducer(state, action);
    viewerContextDispatch({
      type: "CALCULATOR_UPDATE",
      payload: {
        path: path,
        calculator: newState,
      },
    });
    return newState;
  };

export const Calculator: FC<Props> = ({
  value: calculator,
  environment,
  settings,
  renderValue,
  valueWithContext,
}) => {
  const { path } = valueWithContext.context;
  const { getSettings, dispatch: viewerContextDispatch } = useViewerContext();
  const itemSettings = getSettings({ path });

  //It's possible that the calculator was changed when ths component was not visible. If that's the case, we want to reset it. We only want to use the cached version if its the same calculator.
  const getInitialCalculatorState = (calculator: SqCalculator) => {
    const isSameCalculator =
      itemSettings.calculator &&
      hasSameCalculator(itemSettings.calculator, calculator);

    console.log("INITIALIZING", isSameCalculator, itemSettings.calculator);

    if (isSameCalculator) {
      return itemSettings.calculator!;
    } else {
      return initialCalculatorState(calculator);
    }
  };

  const [calculatorState, calculatorDispatch] = useReducer(
    adjustedReducer(path, viewerContextDispatch),
    getInitialCalculatorState(calculator)
  );

  const [prevCalculator, setPrevCalculator] = useState<SqCalculator | null>(
    null
  );

  const init = async () => {
    console.log("AWAIT INITIALIZING");
    await initialize({
      dispatch: calculatorDispatch,
      state: calculatorState,
      path,
      calculator,
      environment,
    });
  };

  useEffect(() => {
    init();
  }, []);

  //We want to reset the calculator state if the calculator changes
  useEffect(() => {
    const calculatorChanged =
      prevCalculator !== null &&
      !hasSameCalculator(calculatorState, prevCalculator);

    if (calculatorChanged) {
      console.log("resetting calculator");
      calculatorDispatch({
        type: "RESET",
        payload: {
          path: path,
          state: initialCalculatorState(calculator),
        },
      });
      init();
    }
    setPrevCalculator(calculator);
  }, [calculator]);

  const handleChange =
    (name: string) =>
    async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newCode = e.target.value;

      calculatorState &&
        (await updateCode({
          dispatch: calculatorDispatch,
          path,
          environment: environment,
          state: calculatorState,
          name,
          code: newCode,
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
          const field = calculatorState!.fields[name];
          if (field) {
            const { value, code } = field;
            const result = value;
            const resultHasInterestingError =
              result && !result.ok && code !== "";
            return (
              <div key={name} className="flex flex-col max-w-lg">
                <div className="text-sm font-semibold text-slate-800">
                  {name}
                </div>
                {description && (
                  <div className="text-sm  text-slate-600">{description}</div>
                )}
                <div className="flex-grow">
                  <StyledInput
                    value={code || ""}
                    onChange={handleChange(name)}
                    placeholder={`Enter code for ${name}`}
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
          }
        })}
      {calculatorState?.fn.value && (
        <div>
          <div className="text-md font-bold text-slate-800">Result</div>
          {showSqValue(calculatorState.fn.value, resultSettings)}
        </div>
      )}
    </div>
  );
};
