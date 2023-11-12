import { FC, useEffect, useMemo, useState, useCallback, useRef } from "react";

import { Env, SqValue } from "@quri/squiggle-lang";

import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { ValueResultViewer } from "./ValueResultViewer.js";
import {
  InputResults,
  SqCalculatorValueWithContext,
  SqValueResult,
} from "./types.js";
import { useSavedCalculatorState } from "./useSavedCalculatorState.js";
import { Button } from "@quri/ui";

type Props = {
  valueWithContext: SqCalculatorValueWithContext;
  inputResults: InputResults;
  environment: Env;
  settings: PlaygroundSettings;
  processAllFieldCodes: () => void;
  autorun: boolean;
};

function useDeepCompareMemoize(
  value: PlaygroundSettings
): PlaygroundSettings | undefined {
  const ref = useRef<PlaygroundSettings | undefined>();

  if (JSON.stringify(value) !== JSON.stringify(ref.current)) {
    ref.current = value;
  }

  return ref.current;
}

export const CalculatorResult: FC<Props> = ({
  valueWithContext,
  inputResults,
  environment,
  settings,
  processAllFieldCodes,
  autorun,
}) => {
  const _settings = useDeepCompareMemoize(settings);
  const [savedState, updateSavedState] =
    useSavedCalculatorState(valueWithContext);

  const calculator = useMemo(() => valueWithContext.value, [valueWithContext]);

  const [calculatorResult, setCalculatorResult] = useState<
    SqValueResult | undefined
  >(() => savedState?.calculatorResult);

  const valueResultViewer = useMemo(() => {
    return (
      !!calculatorResult &&
      _settings && (
        <ValueResultViewer result={calculatorResult} settings={_settings} />
      )
    );
  }, [calculatorResult, _settings]);

  const runCalculator = useCallback(() => {
    !autorun && processAllFieldCodes();
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
  }, [calculator, environment, inputResults, processAllFieldCodes, autorun]);

  //runCalculator is updated every time that the inputResults or calculator changes, after which this will trigger.
  useEffect(() => {
    autorun && runCalculator();
  }, [runCalculator, autorun]);

  // Back up calculatorResult to ViewerContext.
  useEffect(() => {
    updateSavedState({
      hashString: calculator.hashString,
      calculatorResult,
    });
  }, [updateSavedState, calculator, calculatorResult]);

  return (
    <div className="py-3 px-5">
      {!autorun && (
        <div className="mb-3">
          <Button size="small" onClick={runCalculator} theme="primary">
            Run
          </Button>
        </div>
      )}
      {calculatorResult ? (
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-2">Result</div>
          {valueResultViewer}
        </div>
      ) : null}
    </div>
  );
};
