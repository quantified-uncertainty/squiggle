import {
  SqValue,
  SqCalculator,
  SqError,
  SqProject,
  result,
  Env,
} from "@quri/squiggle-lang";

import {
  CalculatorState,
  CalculatorAction,
  calculatorReducer,
  SqValueResult,
  allFieldResults,
  allFieldValuesAreValid,
} from "./calculatorReducer.js";
import { alterCodeForSquiggleRun } from "../../lib/inputUtils.js";

async function runSquiggleCode(
  code: string,
  environment: Env
): Promise<result<SqValue, SqError>> {
  const project = SqProject.create();
  if (environment) {
    project.setEnvironment(environment);
  }
  const sourceId = "calculator";
  project.setSource(sourceId, code);
  await project.run(sourceId);
  return project.getResult(sourceId);
}

type Dispatch = (action: CalculatorAction) => void;

export function updateFnValue({
  state,
  calculator,
  environment,
  dispatch,
}: {
  state: CalculatorState;
  calculator: SqCalculator;
  environment: Env;
  dispatch: Dispatch;
}) {
  let finalResult: SqValueResult | undefined = undefined;
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
}

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

// Gets all input codes. Runs them all, runs the function, and updates all these values in the state.
export async function processAllFieldCodes({
  codes,
  dispatch,
  calculator,
  state,
  environment,
}: {
  codes: Record<string, string>;
  dispatch: Dispatch;
  calculator: SqCalculator;
  state: CalculatorState;
  environment: Env;
}) {
  let _state = state;
  for (const name of state.inputNames) {
    const code = codes[name];
    const valueResult = await runSquiggleCode(
      modifyCode(name, calculator, code),
      environment
    );
    const action: CalculatorAction = {
      type: "SET_FIELD_VALUE",
      payload: { name, value: valueResult },
    };
    _state = calculatorReducer(_state, action);
    dispatch(action);
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
  const valueResult = await runSquiggleCode(
    modifyCode(name, calculator, code),
    environment
  );
  const setValueAction: CalculatorAction = {
    type: "SET_FIELD_VALUE",
    payload: { name, value: valueResult },
  };
  dispatch(setValueAction);
  const _state = calculatorReducer(state, setValueAction);

  updateFnValue({ state: _state, calculator, environment, dispatch });
}
