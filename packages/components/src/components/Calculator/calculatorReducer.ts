import React, { Reducer } from "react";

import {
  SqValue,
  SqCalculator,
  SqError,
  SqProject,
  result,
} from "@quri/squiggle-lang";
import { Env } from "@quri/squiggle-lang";

import { useReducerAsync, AsyncActionHandlers } from "use-reducer-async";
import _ from "lodash";

type optionalResultValue = result<SqValue, SqError> | null;

export type FieldValue = {
  name: string;
  code: string;
  value: optionalResultValue;
};

export type ResultValue = {
  value: optionalResultValue;
};

export type CalculatorState = {
  fieldNames: string[];
  fields: Record<string, FieldValue>;
  fn: ResultValue;
};

export function allFields(state: CalculatorState): FieldValue[] {
  return state.fieldNames.map((name) => state.fields[name]);
}

export function allFieldResults(state: CalculatorState): optionalResultValue[] {
  return allFields(state).map((r) => r.value);
}

export function allFieldValuesAreValid(state: CalculatorState): boolean {
  return _.every(allFieldResults(state), (result) => result && result.ok);
}

export function initialState(calculator: SqCalculator): CalculatorState {
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

export const calculatorReducer = (
  state: CalculatorState,
  action: Action
): CalculatorState => {
  const modifyField = (name: string, newField: FieldValue) => {
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

export const runSquiggleCode = async (
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

export const asyncActionHandlers: AsyncActionHandlers<
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
      state = calculatorReducer(
        calculatorReducer(state, setCodeAction),
        setValueAction
      );
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
        state = calculatorReducer(state, _action);
      }
      await updateFnValue(state, action.calc, action.env, dispatch);
    },
};

export function useCalculatorReducer(
  calc: SqCalculator
): [CalculatorState, React.Dispatch<AsyncAction>] {
  const [state, dispatch] = useReducerAsync(
    calculatorReducer,
    initialState(calc),
    asyncActionHandlers
  );
  return [state, dispatch];
}
