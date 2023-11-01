import { FC, useEffect, useMemo, useState } from "react";

import { Env, SqValue } from "@quri/squiggle-lang";

import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { ValueResultViewer } from "./ValueResultViewer.js";
import {
  InputResults,
  SqCalculatorValueWithContext,
  SqValueResult,
} from "./types.js";
import { useSavedCalculatorState } from "./useSavedCalculatorState.js";

type Props = {
  valueWithContext: SqCalculatorValueWithContext;
  inputResults: InputResults;
  environment: Env;
  settings: PlaygroundSettings;
};

export const CalculatorResult: FC<Props> = ({
  valueWithContext,
  inputResults,
  environment,
  settings,
}) => {
  const [savedState, updateSavedState] =
    useSavedCalculatorState(valueWithContext);

  const calculator = useMemo(() => valueWithContext.value, [valueWithContext]);

  const [calculatorResult, setCalculatorResult] = useState<
    SqValueResult | undefined
  >(() => savedState?.calculatorResult);

  // Whenever `inputResults` change, we recalculate `calculatorResult`.
  useEffect(() => {
    const parameters: SqValue[] = [];

    // Unpack all input values.
    for (const input of calculator.inputs) {
      const inputResult = inputResults[input.name];
      if (!inputResult || !inputResult.ok) {
        // One of inputs is incorrect.
        setCalculatorResult(undefined);
        return;
      }
      parameters.push(inputResult.value);
    }

    const finalResult = calculator.run(parameters, environment);
    setCalculatorResult(finalResult);
  }, [calculator, environment, inputResults]);

  // Back up calculatorResult to ViewerContext.
  useEffect(() => {
    updateSavedState({
      hashString: calculator.hashString,
      calculatorResult,
    });
  }, [updateSavedState, calculator, calculatorResult]);

  return calculatorResult ? (
    <div className="py-3 px-5">
      <div className="text-sm font-semibold text-gray-700 mb-2">Result</div>
      <ValueResultViewer result={calculatorResult} settings={settings} />
    </div>
  ) : null;
};
