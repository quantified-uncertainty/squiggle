import {
  SqValue,
  SqCalculator,
  SqError,
  SqProject,
  SqValuePath,
  result,
  Env,
} from "@quri/squiggle-lang";

import {
  CalculatorState,
  CalculatorAction,
  calculatorReducer,
  resultSqValue,
  allFieldResults,
  allFieldValuesAreValid,
} from "./calculatorReducer.js";
import { alterCodeForSquiggleRun } from "../../lib/inputUtils.js";

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
  return project.getResult(sourceId);
};

type Dispatch = (action: CalculatorAction) => void;

export const updateFnValue = ({
  state,
  calculator,
  environment,
  dispatch,
}: {
  state: CalculatorState;
  calculator: SqCalculator;
  environment: Env;
  dispatch: Dispatch;
}) => {
  let finalResult: resultSqValue | undefined = undefined;
  if (allFieldValuesAreValid(state)) {
    const results: SqValue[] = allFieldResults(state).map((result) => {
      if (result && result.ok) {
        return result.value;
      } else {
        throw new Error("Invalid result encountered.");
      }
    });
    finalResult = calculator.run(results, environment);
  } else {
    finalResult = undefined;
  }

  dispatch({
    type: "SET_FUNCTION_VALUE",
    payload: { value: finalResult },
  });
};

function modifyCode(
  name: string,
  calculator: SqCalculator,
  code: string
): string {
  const input = calculator.inputs.find((row) => row.name === name);
  if (!input) {
    throw new Error("Invalid input name.");
  }
  return alterCodeForSquiggleRun(input, code);
}
// Gets all input codes in the State. Runs them all, runs the function, and updates all these values in the state.
export async function processAllFieldCodes({
  dispatch,
  calculator,
  state,
  environment,
}: {
  dispatch: Dispatch;
  calculator: SqCalculator;
  state: CalculatorState;
  environment: Env;
}) {
  let _state = state;
  for (const name of state.inputNames) {
    const input = state.inputs[name];
    const valueResult = await runSquiggleCode(
      modifyCode(name, calculator, input.code),
      environment
    );
    const _action: CalculatorAction = {
      type: "SET_FIELD_VALUE",
      payload: { name, value: valueResult },
    };
    _state = calculatorReducer(_state, _action);
    dispatch(_action);
  }
  updateFnValue({ state: _state, calculator, environment, dispatch });
}

// Takes an updated input code, runs it, and runs the function.
export async function updateAndProcessFieldCode({
  dispatch,
  environment,
  state,
  calculator,
  name,
  code,
}: {
  dispatch: Dispatch;
  state: CalculatorState;
  calculator: SqCalculator;
  environment: Env;
  name: string;
  code: string;
}) {
  const setCodeAction: CalculatorAction = {
    type: "SET_FIELD_CODE",
    payload: { name: name, code: code },
  };
  dispatch(setCodeAction);
  let _state = calculatorReducer(state, setCodeAction);

  const valueResult = await runSquiggleCode(
    modifyCode(name, calculator, code),
    environment
  );
  const setValueAction: CalculatorAction = {
    type: "SET_FIELD_VALUE",
    payload: { name: name, value: valueResult },
  };
  dispatch(setValueAction);
  _state = calculatorReducer(_state, setValueAction);

  updateFnValue({ state: _state, calculator, environment, dispatch });
}
