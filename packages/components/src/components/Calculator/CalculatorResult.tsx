import { FC, useEffect, useMemo, useState, useCallback } from "react";

import { Env, SqValue } from "@quri/squiggle-lang";

import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { ValueResultViewer } from "./ValueResultViewer.js";
import {
  InputValues,
  SqCalculatorValueWithContext,
  SqValueResult,
} from "./types.js";
import { useSavedCalculatorState } from "./useSavedCalculatorState.js";
import { Button } from "@quri/ui";

type Props = {
  valueWithContext: SqCalculatorValueWithContext;
  inputValues: InputValues;
  environment: Env;
  settings: PlaygroundSettings;
  processAllFieldCodes: () => void;
  autoRun: boolean;
};

export const CalculatorResult: FC<Props> = ({
  valueWithContext,
  inputValues,
  environment,
  settings,
  processAllFieldCodes,
  autoRun,
}) => {
  const [cachedState, updateCachedState] =
    useSavedCalculatorState(valueWithContext);

  const calculator = useMemo(() => valueWithContext.value, [valueWithContext]);

  const [fnValue, setFnValue] = useState<SqValueResult | undefined>(
    () => cachedState?.fnValue
  );

  const runCalculator = useCallback(() => {
    !autoRun && processAllFieldCodes();
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
  }, [calculator, environment, inputValues, processAllFieldCodes, autoRun]);

  useEffect(() => {
    autoRun && runCalculator();
  }, [runCalculator, autoRun]);

  // Back up fnValue to ViewerContext.
  useEffect(() => {
    updateCachedState({
      hashString: calculator.hashString,
      fnValue,
    });
  }, [updateCachedState, calculator, fnValue]);

  return (
    <div className="py-3 px-5">
      {!autoRun && (
        <Button size="small" onClick={runCalculator} theme="primary">
          Run
        </Button>
      )}
      {fnValue ? (
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-2">Result</div>
          <ValueResultViewer result={fnValue} settings={settings} />
        </div>
      ) : null}
    </div>
  );
};
