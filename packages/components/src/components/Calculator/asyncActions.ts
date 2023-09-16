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

const updateFnValue = (
  path: SqValuePath,
  state: CalculatorState,
  calc: SqCalculator,
  env: Env,
  dispatch: Dispatch
) => {
  let finalResult: resultSqValue | undefined = undefined;
  if (allFieldValuesAreValid(state)) {
    const results: SqValue[] = allFieldResults(state).map((result) => {
      if (result && result.ok) {
        return result.value;
      } else {
        throw new Error("Invalid result encountered.");
      }
    });
    finalResult = calc.run(results, env);
  } else {
    finalResult = undefined;
  }

  dispatch({
    type: "SET_FUNCTION_VALUE",
    payload: { path, value: finalResult },
  });
};

// Gets all field codes in the State. Runs them all, runs the function, and updates all these values in the state.
export async function processAllFieldCodes({
  dispatch,
  path,
  calculator,
  state,
  environment,
}: {
  dispatch: Dispatch;
  path: SqValuePath;
  calculator: SqCalculator;
  state: CalculatorState;
  environment: Env;
}) {
  let _state = state;
  for (const name of state.fieldNames) {
    const field = state.fields[name];
    const valueResult = await runSquiggleCode(field.code, environment);
    const _action: CalculatorAction = {
      type: "SET_FIELD_VALUE",
      payload: { name, value: valueResult, path },
    };
    _state = calculatorReducer(_state, _action);
    dispatch(_action);
  }
  updateFnValue(path, _state, calculator, environment, dispatch);
}

// Takes an updated field code, runs it, and runs the function.
export async function updateAndProcessFieldCode({
  dispatch,
  path,
  environment,
  state,
  calculator,
  name,
  code,
}: {
  dispatch: Dispatch;
  path: SqValuePath;
  state: CalculatorState;
  calculator: SqCalculator;
  environment: Env;
  name: string;
  code: string;
}) {
  const setCodeAction: CalculatorAction = {
    type: "SET_FIELD_CODE",
    payload: { path, name: name, code: code },
  };
  dispatch(setCodeAction);
  let _state = calculatorReducer(state, setCodeAction);

  const valueResult = await runSquiggleCode(code, environment);
  const setValueAction: CalculatorAction = {
    type: "SET_FIELD_VALUE",
    payload: { path, name: name, value: valueResult },
  };
  dispatch(setValueAction);
  _state = calculatorReducer(_state, setValueAction);

  updateFnValue(path, _state, calculator, environment, dispatch);
}
