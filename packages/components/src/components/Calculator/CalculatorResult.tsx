import { FC, useEffect, useMemo, useState } from "react";

import { Env, SqValue } from "@quri/squiggle-lang";

import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { ValueResultViewer } from "./ValueResultViewer.js";
import {
  InputValues,
  SqCalculatorValueWithContext,
  SqValueResult,
} from "./types.js";
import { useSavedCalculatorState } from "./useSavedCalculatorState.js";

type Props = {
  valueWithContext: SqCalculatorValueWithContext;
  inputValues: InputValues;
  environment: Env;
  settings: PlaygroundSettings;
};

export const CalculatorResult: FC<Props> = ({
  valueWithContext,
  inputValues,
  environment,
  settings,
}) => {
  const [cachedState, updateCachedState] =
    useSavedCalculatorState(valueWithContext);

  const calculator = useMemo(() => valueWithContext.value, [valueWithContext]);

  const [fnValue, setFnValue] = useState<SqValueResult | undefined>(
    () => cachedState?.fnValue
  );

  // Whenever `inputValues` change, we recalculate `fnValue`.
  useEffect(() => {
    const parameters: SqValue[] = [];

    // Unpack all input values.
    for (const input of calculator.inputs) {
      const inputValue = inputValues[input.name];
      if (!inputValue || !inputValue.ok) {
        // One of inputs is incorrect.
        setFnValue(undefined);
        return;
      }
      parameters.push(inputValue.value);
    }

    const finalResult = calculator.run(parameters, environment);
    setFnValue(finalResult);
  }, [calculator, environment, inputValues]);

  // Back up fnValue to ViewerContext.
  useEffect(() => {
    updateCachedState({
      hashString: calculator.hashString,
      fnValue,
    });
  }, [updateCachedState, calculator, fnValue]);

  return fnValue ? (
    <div className="py-3 px-5">
      <div className="text-sm font-semibold text-gray-700 mb-2">Result</div>
      <ValueResultViewer result={fnValue} settings={settings} />
    </div>
  ) : null;
};
