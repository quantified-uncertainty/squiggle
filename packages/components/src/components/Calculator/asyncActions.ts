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
  optionalResultValue,
  allFieldResults,
  allFieldValuesAreValid,
  initialCalculatorState,
} from "./calculatorReducer.js";

import { ViewProviderDispatch } from "../SquiggleViewer/ViewerProvider.js";

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

const updateFnValue = async (
  path: SqValuePath,
  state: CalculatorState,
  calc: SqCalculator,
  env: Env,
  dispatch: ViewProviderDispatch
) => {
  let finalResult: optionalResultValue = null;
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
    finalResult = null;
  }

  dispatch({
    type: "CALCULATOR_SET_FN_VALUE",
    payload: { path, value: finalResult },
  });
};

export async function initialize({
  dispatch,
  path,
  calculator,
  environment,
}: {
  dispatch: ViewProviderDispatch;
  path: SqValuePath;
  calculator: SqCalculator;
  environment: Env;
}) {
  let state = initialCalculatorState(calculator);
  dispatch({
    type: "CALCULATOR_INITIALIZE",
    payload: { path, calculator: state },
  });

  for (const name of state.fieldNames) {
    const field = state.fields[name];
    const valueResult = await runSquiggleCode(field.code, environment);
    const _action: CalculatorAction = {
      type: "CALCULATOR_SET_FIELD_VALUE",
      payload: { name, value: valueResult, path },
    };
    state = calculatorReducer(state, _action);
    dispatch(_action);
  }
  await updateFnValue(path, state, calculator, environment, dispatch);
}

export async function updateCode({
  dispatch,
  path,
  environment,
  state,
  calculator,
  name,
  code,
  forceUpdate,
}: {
  dispatch: ViewProviderDispatch;
  path: SqValuePath;
  state: CalculatorState;
  calculator: SqCalculator;
  environment: Env;
  name: string;
  code: string;
  forceUpdate: () => void;
}) {
  const setCodeAction: CalculatorAction = {
    type: "CALCULATOR_SET_FIELD_CODE",
    payload: { path, name: name, code: code },
  };
  dispatch(setCodeAction);
  let _state = calculatorReducer(state, setCodeAction);
  forceUpdate();

  const valueResult = await runSquiggleCode(code, environment);
  const setValueAction: CalculatorAction = {
    type: "CALCULATOR_SET_FIELD_VALUE",
    payload: { path, name: name, value: valueResult },
  };
  dispatch(setValueAction);
  _state = calculatorReducer(_state, setValueAction);

  await updateFnValue(path, _state, calculator, environment, dispatch);
  forceUpdate();
}
