import React, { FC, ReactNode, Reducer, useEffect } from "react";

import {
  SqValue,
  SqCalculator,
  SqError,
  SqProject,
  result,
} from "@quri/squiggle-lang";
import { Env } from "@quri/squiggle-lang";

import { useReducerAsync, AsyncActionHandlers } from "use-reducer-async";

import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { SqValueWithContext, valueHasContext } from "../../lib/utility.js";

import ReactMarkdown from "react-markdown";
import _ from "lodash";

type FieldValue = {
  name: string;
  code: string;
  value: result<SqValue, SqError> | null;
};

function isAlreadyCached(f: FieldValue) {
  return f.value?.ok && f.value.value?.context?.source === f.code;
}

type ResultValue = {
  value: result<SqValue, SqError> | null;
};

type CalculatorState = {
  fieldNames: string[];
  fields: Record<string, FieldValue>;
  fn: ResultValue;
};

function allFields(state: CalculatorState) {
  return state.fieldNames.map((name) => state.fields[name]);
}
function allFieldResults(state: CalculatorState) {
  return allFields(state).map((r) => r.value);
}

function allFieldValuesAreValid(state: CalculatorState): boolean {
  return _.every(allFieldResults(state), (result) => result && result.ok);
}

function initialState(calculator: SqCalculator): CalculatorState {
  const fields: Record<string, FieldValue> = {};
  calculator.rows.forEach((row) => {
    fields[row.name] = {
      name: row.name,
      code: row.default,
      value: null,
    };
  });
  const fn = {
    value: null,
  };
  return {
    fieldNames: calculator.rows.map((row) => row.name),
    fields,
    fn,
  };
}

type Action =
  | { type: "SET_FIELD_CODE"; payload: { name: string; code: string } }
  | {
      type: "SET_FIELD_VALUE";
      payload: { name: string; value: result<SqValue, SqError> | null };
    }
  | { type: "SET_FN_VALUE"; payload: result<SqValue, SqError> | null };

const reducer = (state: CalculatorState, action: Action): CalculatorState => {
  const modifyField = (name: string, newField) => {
    const newFields = { ...state.fields, [name]: newField };
    return { ...state, fields: newFields };
  };
  switch (action.type) {
    case "SET_FIELD_CODE": {
      const { name, code } = action.payload;
      const field = state.fields[name];
      const newValue = null;
      const newField = { ...field, code, value: newValue };
      return modifyField(name, newField);
    }
    case "SET_FIELD_VALUE": {
      const { name, value } = action.payload;
      const field = state.fields[name];
      const newField = { ...field, value };
      return modifyField(name, newField);
    }
    case "SET_FN_VALUE": {
      return { ...state, fn: { value: action.payload } };
    }
  }
};

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

type AsyncAction =
  | { type: "INITIALIZE"; env: Env; calc: SqCalculator }
  | {
      type: "UPDATE_FIELD";
      name: string;
      code: string;
      env: Env;
      calc: SqCalculator;
    };

const updateFnValue = async (
  state: CalculatorState,
  calc: SqCalculator,
  env: Env,
  dispatch: React.Dispatch<Action>
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
    type: "SET_FN_VALUE",
    payload: finalResult,
  });
};

const asyncActionHandlers: AsyncActionHandlers<
  Reducer<CalculatorState, Action>,
  AsyncAction
> = {
  UPDATE_FIELD:
    ({ dispatch, getState }) =>
    async (action) => {
      let state = getState();
      const setCodeAction: Action = {
        type: "SET_FIELD_CODE",
        payload: { name: action.name, code: action.code },
      };
      dispatch(setCodeAction);

      const valueResult = await runSquiggleCode(action.code, action.env);
      const setValueAction: Action = {
        type: "SET_FIELD_VALUE",
        payload: { name: action.name, value: valueResult },
      };
      dispatch(setValueAction);
      state = reducer(reducer(state, setCodeAction), setValueAction);
      await updateFnValue(state, action.calc, action.env, dispatch);
    },
  INITIALIZE:
    ({ dispatch, getState }) =>
    async (action) => {
      let state = getState();
      for (const name of state.fieldNames) {
        const field = state.fields[name];
        const valueResult = await runSquiggleCode(field.code, action.env);
        const _action: Action = {
          type: "SET_FIELD_VALUE",
          payload: { name, value: valueResult },
        };
        dispatch(_action);
        state = reducer(state, _action);
      }
      await updateFnValue(state, action.calc, action.env, dispatch);
    },
};

export const Calculator: FC<Props> = ({
  value,
  environment,
  settings,
  renderValue,
}) => {
  const [state, dispatch] = useReducerAsync(
    reducer,
    initialState(value),
    asyncActionHandlers
  );

  useEffect(() => {
    dispatch({
      type: "INITIALIZE",
      env: environment,
      calc: value,
    });
  }, []);

  const handleChange =
    (name: string) =>
    async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newCode = e.target.value;
      dispatch({
        type: "UPDATE_FIELD",
        name,
        code: newCode,
        env: environment,
        calc: value,
      });
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
        const { value, code } = state.fields[name];
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
              {result && showSqValue(result, fieldShowSettings)}
              {!result && (
                <div className="text-sm text-gray-500">No result</div>
              )}
            </div>
          </div>
        );
      })}
      {state.fn.value?.ok && (
        <div>
          <div className="text-md font-bold text-slate-800">Result</div>
          {showSqValue(state.fn.value, resultSettings)}
        </div>
      )}
    </div>
  );
};
