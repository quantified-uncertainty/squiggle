import {
  SqValue,
  SqCalculator,
  SqError,
  SqValuePath,
  result,
} from "@quri/squiggle-lang";

import _ from "lodash";

export type optionalResultValue = result<SqValue, SqError> | undefined;

export type FieldValue = {
  name: string;
  code: string;
  value?: optionalResultValue;
};

export type ResultValue = {
  value?: optionalResultValue;
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

export function initialCalculatorState(
  calculator: SqCalculator
): CalculatorState {
  const fields: Record<string, FieldValue> = {};
  calculator.rows.forEach((row) => {
    fields[row.name] = {
      name: row.name,
      code: row.default,
    };
  });
  return {
    fieldNames: calculator.rows.map((row) => row.name),
    fields,
    fn: {},
  };
}

export type CalculatorAction =
  | {
      type: "CALCULATOR_SET_FIELD_CODE";
      payload: { path: SqValuePath; name: string; code: string };
    }
  | {
      type: "CALCULATOR_SET_FIELD_VALUE";
      payload: {
        path: SqValuePath;
        name: string;
        value: optionalResultValue;
      };
    }
  | {
      type: "CALCULATOR_SET_FN_VALUE";
      payload: { path: SqValuePath; value: optionalResultValue };
    };

export const calculatorReducer = (
  state: CalculatorState,
  action: CalculatorAction
): CalculatorState => {
  const modifyField = (name: string, newField: FieldValue) => {
    const newFields = { ...state.fields, [name]: newField };
    return { ...state, fields: newFields };
  };
  switch (action.type) {
    case "CALCULATOR_SET_FIELD_CODE": {
      const { name, code } = action.payload;
      const field = state.fields[name];
      const newField = { ...field, code, value: undefined };
      return modifyField(name, newField);
    }
    case "CALCULATOR_SET_FIELD_VALUE": {
      const { name, value } = action.payload;
      const field = state.fields[name];
      const newField = { ...field, value };
      return modifyField(name, newField);
    }
    case "CALCULATOR_SET_FN_VALUE": {
      return { ...state, fn: { value: action.payload.value } };
    }
  }
};
