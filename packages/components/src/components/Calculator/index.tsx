import React, { FC, ReactNode, useEffect, useReducer } from "react";

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
import {
  CalculatorState,
  runSquiggleCode,
  allFieldValuesAreValid,
  allFieldResults,
  initialState,
} from "./calculatorReducer.js";

import {
  useViewerContext,
  useCalculatorFns,
} from "../SquiggleViewer/ViewerProvider.js";

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

const updateFnValue = async (
  path: SqValuePath,
  state: CalculatorState,
  calc: SqCalculator,
  env: Env,
  dispatch
) => {
  let finalResult: result<SqValue, SqError> | null = null;
  if (allFieldValuesAreValid(state)) {
    const results: SqValue[] = allFieldResults(state).map((res) => {
      if (res && res.ok) {
        return res.value;
      } else {
        throw new Error("Invalid result encountered.");
      }
    });
    finalResult = calc.run(results, env);
  } else {
    finalResult = null;
  }

  dispatch({
    type: "CALCULATOR_SET_FN_VALUE",
    payload: { path, value: finalResult },
  });
};

async function initStuff(
  dispatch,
  path: SqValuePath,
  state: CalculatorState,
  calc: SqCalculator,
  env
) {
  for (const name of state.fieldNames) {
    const field = state.fields[name];
    const valueResult = await runSquiggleCode(field.code, env);
    const _action = {
      type: "CALCULATOR_SET_FIELD_VALUE",
      payload: { name, value: valueResult, path },
    };
    dispatch(_action);
  }
  updateFnValue(path, state, calc, env, dispatch);
}

async function updateCode(
  dispatch,
  path: SqValuePath,
  state: CalculatorState,
  calc: SqCalculator,
  env,
  name: string,
  code: string,
  forceUpdate: () => void
) {
  const setCodeAction = {
    type: "CALCULATOR_SET_FIELD_CODE",
    payload: { path, name: name, code: code },
  };
  dispatch(setCodeAction);
  forceUpdate();

  const valueResult = await runSquiggleCode(code, env);
  const setValueAction = {
    type: "CALCULATOR_SET_FIELD_VALUE",
    payload: { path, name: name, value: valueResult },
  };
  dispatch(setValueAction);
  forceUpdate();
}

export const Calculator: FC<Props> = ({
  value,
  environment,
  settings,
  renderValue,
  valueWithContext,
}) => {
  const { path } = valueWithContext.context;
  const { getSettings, dispatch } = useViewerContext();
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const gotSettings = getSettings({ path, defaults: undefined });
  const { intitialize } = useCalculatorFns();

  useEffect(() => {
    const init = async () => {
      intitialize(path, value);
      await initStuff(dispatch, path, initialState(value), value, environment);
      forceUpdate();
    };

    if (!gotSettings.calculator) {
      init();
    }
  }, []);

  const handleChange =
    (name: string) =>
    async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newCode = e.target.value;

      const state = gotSettings.calculator;
      state &&
        updateCode(
          dispatch,
          path,
          state,
          value,
          environment,
          name,
          newCode,
          forceUpdate
        );
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

      {gotSettings.calculator &&
        value.rows.map((row) => {
          const { name, description } = row;
          const { value, code } = gotSettings.calculator!.fields[name];
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
      {gotSettings.calculator?.fn.value?.ok && (
        <div>
          <div className="text-md font-bold text-slate-800">Result</div>
          {showSqValue(gotSettings.calculator.fn.value, resultSettings)}
        </div>
      )}
    </div>
  );
};
