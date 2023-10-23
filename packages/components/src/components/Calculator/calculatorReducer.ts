import {
  SqValue,
  SqCalculator,
  SqError,
  SqValuePath,
  result,
} from "@quri/squiggle-lang";
import { defaultAsString } from "../../lib/inputUtils.js";

export type resultSqValue = result<SqValue, SqError>;

export type FieldValue = {
  name: string;
  code: string;
  value?: resultSqValue;
};

export type ResultValue = {
  value?: resultSqValue;
};

export type CalculatorState = {
  inputNames: string[];
  inputs: Record<string, FieldValue>;
  fn: ResultValue;
  hash: string;
};

export function hasSameCalculator(state: CalculatorState, calc: SqCalculator) {
  return calc.hashString === state.hash;
}

export function allFields(state: CalculatorState): FieldValue[] {
  return state.inputNames.map((name) => state.inputs[name]);
}

export function allFieldResults(
  state: CalculatorState
): (resultSqValue | undefined)[] {
  return allFields(state).map((r) => r.value);
}

export function allFieldValuesAreValid(state: CalculatorState): boolean {
  return allFieldResults(state).every((result) => result?.ok);
}

export function initialCalculatorState(
  calculator: SqCalculator
): CalculatorState {
  const inputs: Record<string, FieldValue> = {};
  calculator.inputs.forEach((row) => {
    inputs[row.name] = {
      name: row.name,
      code: defaultAsString(row),
    };
  });
  return {
    inputNames: calculator.inputs.map((row) => row.name),
    inputs,
    fn: {},
    hash: calculator.hashString,
  };
}

export type CalculatorAction =
  | {
      type: "RESET";
      payload: { state: CalculatorState };
    }
  | {
      type: "SET_FIELD_CODE";
      payload: { name: string; code: string };
    }
  | {
      type: "SET_FIELD_VALUE";
      payload: {
        name: string;
        value?: resultSqValue;
      };
    }
  | {
      type: "SET_FUNCTION_VALUE";
      payload: { value?: resultSqValue };
    };

export const calculatorReducer = (
  state: CalculatorState,
  action: CalculatorAction
): CalculatorState => {
  const modifyField = (name: string, newField: FieldValue) => {
    const newFields = { ...state.inputs, [name]: newField };
    return { ...state, inputs: newFields };
  };
  switch (action.type) {
    case "RESET": {
      return action.payload.state;
    }
    case "SET_FIELD_CODE": {
      const { name, code } = action.payload;
      const input = state.inputs[name];
      const newField = { ...input, code, value: undefined };
      return modifyField(name, newField);
    }
    case "SET_FIELD_VALUE": {
      const { name, value } = action.payload;
      const input = state.inputs[name];
      const newField = { ...input, value };
      return modifyField(name, newField);
    }
    case "SET_FUNCTION_VALUE": {
      return { ...state, fn: { value: action.payload.value } };
    }
  }
};
