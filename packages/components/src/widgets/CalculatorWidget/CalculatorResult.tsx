import { FC, useCallback, useEffect, useMemo, useState } from "react";

import { Env, SqValue } from "@quri/squiggle-lang";
import { Button } from "@quri/ui";

import { PlaygroundSettings } from "../../components/PlaygroundSettings.js";
import { SquiggleValueResultChart } from "../../components/SquiggleViewer/SquiggleValueResultViewer.js";
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
  processAllFieldCodes: () => void;
  autorun: boolean;
};

export const CalculatorResult: FC<Props> = ({
  valueWithContext,
  inputResults,
  environment,
  settings,
  processAllFieldCodes,
  autorun,
}) => {
  const [savedState, updateSavedState] =
    useSavedCalculatorState(valueWithContext);

  const calculator = useMemo(() => valueWithContext.value, [valueWithContext]);

  const [calculatorResult, setCalculatorResult] = useState<
    SqValueResult | undefined
  >(() => savedState?.calculatorResult);

  const runCalculator = useCallback(() => {
    if (!autorun) {
      processAllFieldCodes();
    }
    const parameters: SqValue[] = [];

    // Unpack all input values.
    for (let i = 0; i < calculator.inputs.length; i++) {
      const inputResult = inputResults[i];
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
    if (autorun) {
      runCalculator();
    }
  }, [runCalculator, autorun]);

  // Back up calculatorResult to ViewerContext.
  useEffect(() => {
    updateSavedState({
      hashString: calculator.hashString,
      calculatorResult,
    });
  }, [updateSavedState, calculator, calculatorResult]);

  return (
    <div className="px-5 py-3">
      {!autorun && (
        <div className="mb-3">
          <Button size="small" onClick={runCalculator} theme="primary">
            Run
          </Button>
        </div>
      )}
      {calculatorResult ? (
        <div>
          <div className="mb-2 text-sm font-semibold text-gray-700">Result</div>
          <SquiggleValueResultChart
            result={calculatorResult}
            settings={settings}
          />
        </div>
      ) : null}
    </div>
  );
};
