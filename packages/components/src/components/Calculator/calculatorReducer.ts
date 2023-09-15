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
  hash: string;
};

// This function is used to determine if a calculator has changed.
// It's obviously not perfect - it doesn't capture changes within the calculator function, but this would be much more complicated.
function calculatorHash(calc: SqCalculator): string {
  const rowData = JSON.stringify(calc.fields);
  const paramData = (calc.parameters || []).join(",");
  return rowData + paramData + calc.description;
}

export function hasSameCalculator(state: CalculatorState, calc: SqCalculator) {
  return calculatorHash(calc) === state.hash;
}

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
  calculator.fields.forEach((row) => {
    fields[row.name] = {
      name: row.name,
      code: row.default,
    };
  });
  return {
    fieldNames: calculator.fields.map((row) => row.name),
    fields,
    fn: {},
    hash: calculatorHash(calculator),
  };
}

export type CalculatorAction =
  | {
      type: "RESET";
      payload: { path: SqValuePath; state: CalculatorState };
    }
  | {
      type: "SET_FIELD_CODE";
      payload: { path: SqValuePath; name: string; code: string };
    }
  | {
      type: "SET_FIELD_VALUE";
      payload: {
        path: SqValuePath;
        name: string;
        value: optionalResultValue;
      };
    }
  | {
      type: "SET_FUNCTION_VALUE";
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
    case "RESET": {
      return action.payload.state;
    }
    case "SET_FIELD_CODE": {
      const { name, code } = action.payload;
      const field = state.fields[name];
      const newField = { ...field, code, value: undefined };
      return modifyField(name, newField);
    }
    case "SET_FIELD_VALUE": {
      const { name, value } = action.payload;
      const field = state.fields[name];
      const newField = { ...field, value };
      return modifyField(name, newField);
    }
    case "SET_FUNCTION_VALUE": {
      return { ...state, fn: { value: action.payload.value } };
    }
  }
};
