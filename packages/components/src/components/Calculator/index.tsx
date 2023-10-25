import { FC, Reducer, useEffect, useMemo, useReducer, useState } from "react";

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
import { FormProvider, useForm } from "react-hook-form";
import { defaultAsString } from "../../lib/inputUtils.js";

type SqCalculatorValueWithContext = Extract<
  SqValueWithContext,
  { tag: "Calculator" }
>;

type Props = {
  environment: Env;
  settings: PlaygroundSettings;
  valueWithContext: SqCalculatorValueWithContext;
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

function getFormValues(calculator: SqCalculator) {
  return Object.fromEntries(
    calculator.inputs.map((input) => [input.name, defaultAsString(input)])
  );
}

export const Calculator: FC<Props> = ({
  environment,
  settings,
  valueWithContext,
}) => {
  // useMemo here is important; valueWithContext.value is a getter that creates a new calculator value every time
  const calculator = useMemo(() => valueWithContext.value, [valueWithContext]);

  const form = useForm({
    defaultValues: getFormValues(calculator),
  });

  const [state, dispatch] = useCalculatorReducer(valueWithContext);

  const _processAllFieldCodes = async () => {
    await processAllFieldCodes({
      codes: form.getValues(),
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
      form.reset(getFormValues(calculator));
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

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === undefined) return;
      const inputValue = value[name];
      if (inputValue === undefined) return;
      updateAndProcessFieldCode({
        state,
        dispatch,
        calculator,
        environment,
        name,
        code: inputValue,
      });
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  return (
    <FormProvider {...form}>
      <CalculatorUI
        settings={settings}
        calculator={calculator}
        calculatorState={state}
      />
    </FormProvider>
  );
};
