import { FC, ReactNode, Reducer, useEffect, useReducer, useState } from "react";

import { Env, SqCalculator } from "@quri/squiggle-lang";

import { SqValueWithContext } from "../../lib/utility.js";
import { PlaygroundSettings } from "../PlaygroundSettings.js";

import {
  processAllFieldCodes,
  updateAndProcessFieldCode,
  updateFnValue,
} from "./asyncActions.js";

import { useViewerContext } from "../SquiggleViewer/ViewerProvider.js";
import {
  CalculatorAction,
  calculatorReducer,
  CalculatorState,
  hasSameCalculator,
  initialCalculatorState,
} from "./calculatorReducer.js";
import { CalculatorUI } from "./CalculatorUI.js";

type SqCalculatorValueWithContext = Extract<
  SqValueWithContext,
  { tag: "Calculator" }
>;

type Props = {
  environment: Env;
  settings: PlaygroundSettings;
  valueWithContext: SqCalculatorValueWithContext;
  renderValue: (
    value: SqValueWithContext,
    settings: PlaygroundSettings
  ) => ReactNode;
};

function useCalculatorReducer(calculatorValue: SqCalculatorValueWithContext) {
  const calculator = calculatorValue.value;
  const { path } = calculatorValue.context;
  const { getLocalItemState, dispatch: viewerContextDispatch } =
    useViewerContext();

  const getCalculatorStateFromCache = () => {
    const itemState = getLocalItemState({ path });

    const sameCalculatorCacheExists =
      itemState.calculator &&
      hasSameCalculator(itemState.calculator, calculatorValue.value);

    if (sameCalculatorCacheExists) {
      return itemState.calculator!;
    } else {
      return undefined;
    }
  };

  // It's possible that the calculator was changed when the component was not visible. If that's the case, we want to reset it. We only want to use the cached version if its the same calculator.
  const calculatorStateOnFirstRender = () => {
    const cache = getCalculatorStateFromCache();
    return cache ?? initialCalculatorState(calculator);
  };

  // We backup the calculator state in the viewer context, for when the user navigates away and back.
  const adjustedReducer: Reducer<CalculatorState, CalculatorAction> = (
    state,
    action
  ) => {
    const newState = calculatorReducer(state, action);
    viewerContextDispatch({
      type: "CALCULATOR_UPDATE",
      payload: {
        path,
        calculator: newState,
      },
    });
    return newState;
  };

  return useReducer(adjustedReducer, null, calculatorStateOnFirstRender);
}

export const Calculator: FC<Props> = ({
  environment,
  settings,
  renderValue,
  valueWithContext,
}) => {
  const calculator = valueWithContext.value;
  const [state, dispatch] = useCalculatorReducer(valueWithContext);

  const _processAllFieldCodes = async () => {
    await processAllFieldCodes({
      state,
      dispatch,
      calculator,
      environment,
    });
  };

  useEffect(() => {
    _processAllFieldCodes();
  }, []);

  const [prevCalculator, setPrevCalculator] = useState<SqCalculator | null>(
    null
  );

  //We want to reset the calculator state if the calculator changes
  useEffect(() => {
    const calculatorChanged =
      prevCalculator !== null &&
      calculator.hashString !== prevCalculator.hashString;

    if (calculatorChanged) {
      dispatch({
        type: "RESET",
        payload: {
          state: initialCalculatorState(calculator),
        },
      });
      _processAllFieldCodes();
    } else {
      updateFnValue({
        state,
        dispatch,
        calculator,
        environment,
      });
    }
    setPrevCalculator(calculator);
  }, [calculator]);

  const onChange = async (name: string, code: string) => {
    await updateAndProcessFieldCode({
      state,
      dispatch,
      calculator,
      environment,
      name,
      code,
    });
  };

  return (
    <CalculatorUI
      {...{
        renderValue,
        settings,
        calculator,
        calculatorState: state,
        onChange,
      }}
    />
  );
};
