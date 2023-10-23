import { FC, ReactNode, useEffect, useReducer, useState } from "react";
import { FormProvider } from "react-hook-form";

import { Env, SqCalculator, SqValuePath } from "@quri/squiggle-lang";

import { SqValueWithContext } from "../../lib/utility.js";
import { PlaygroundSettings } from "../PlaygroundSettings.js";

import {
  processAllFieldCodes,
  updateAndProcessFieldCode,
  updateFnValue,
} from "./asyncActions.js";

import { Action, useViewerContext } from "../SquiggleViewer/ViewerProvider.js";
import {
  CalculatorAction,
  CalculatorState,
  calculatorReducer,
  hasSameCalculator,
  initialCalculatorState,
} from "./calculatorReducer.js";
import { CalculatorUI } from "./calculatorUI.js";

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

//We backup the calculator state in the viewer context, for when the user navigates away and back
const adjustedReducer =
  (path: SqValuePath, viewerContextDispatch: (action: Action) => void) =>
  (state: CalculatorState, action: CalculatorAction) => {
    const newState = calculatorReducer(state, action);
    viewerContextDispatch({
      type: "CALCULATOR_UPDATE",
      payload: {
        path: path,
        calculator: newState,
      },
    });
    return newState;
  };

export const Calculator: FC<Props> = ({
  value: calculator,
  environment,
  settings,
  renderValue,
  valueWithContext,
}) => {
  const { path } = valueWithContext.context;
  const { getLocalItemState, dispatch: viewerContextDispatch } =
    useViewerContext();
  const itemState = getLocalItemState({ path });
  const [prevCalculator, setPrevCalculator] = useState<SqCalculator | null>(
    null
  );

  const getCalculatorStateFromCache = () => {
    const sameCalculatorCacheExists =
      itemState.calculator &&
      hasSameCalculator(itemState.calculator, calculator);

    if (sameCalculatorCacheExists) {
      return itemState.calculator!;
    } else {
      return undefined;
    }
  };

  //It's possible that the calculator was changed when ths component was not visible. If that's the case, we want to reset it. We only want to use the cached version if its the same calculator.
  const calculatorStateOnFirstRender = (calculator: SqCalculator) => {
    const cache = getCalculatorStateFromCache();
    return cache ? cache : initialCalculatorState(calculator);
  };

  const [calculatorState, calculatorDispatch] = useReducer(
    adjustedReducer(path, viewerContextDispatch),
    calculator,
    calculatorStateOnFirstRender
  );

  const _processAllFieldCodes = async () => {
    await processAllFieldCodes({
      dispatch: calculatorDispatch,
      state: calculatorState,
      path,
      calculator,
      environment,
    });
  };

  useEffect(() => {
    _processAllFieldCodes();
  }, []);

  //We want to reset the calculator state if the calculator changes
  useEffect(() => {
    const calculatorChanged =
      prevCalculator !== null &&
      calculator.hashString !== prevCalculator.hashString;

    if (calculatorChanged) {
      calculatorDispatch({
        type: "RESET",
        payload: {
          path: path,
          state: initialCalculatorState(calculator),
        },
      });
      _processAllFieldCodes();
    } else {
      updateFnValue({
        path,
        state: calculatorState,
        calculator,
        environment,
        dispatch: calculatorDispatch,
      });
    }
    setPrevCalculator(calculator);
  }, [calculator]);

  const onChange = async (name: string, newCode: string) => {
    await updateAndProcessFieldCode({
      dispatch: calculatorDispatch,
      path,
      state: calculatorState,
      calculator,
      environment,
      name,
      code: newCode,
    });
  };

  return (
    <CalculatorUI
      {...{
        renderValue,
        settings,
        calculator,
        calculatorState,
        onChange,
      }}
    />
  );
};
