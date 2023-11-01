import { useCallback, useMemo, useState } from "react";

import { useViewerContext } from "../SquiggleViewer/ViewerProvider.js";
import { SqCalculatorValueWithContext } from "./types.js";
import { CalculatorState } from "./types.js";

/**
 * Takes a calculator value; returns the state from ViewerContext for this calculator and a function for updating the state.
 * The state is only used for calculator initialization. After that, update function get called to keep the state updated.
 */
export function useSavedCalculatorState(
  calculatorValue: SqCalculatorValueWithContext
) {
  const path = useMemo(() => calculatorValue.context.path, [calculatorValue]);

  const { getLocalItemState, dispatch: viewerContextDispatch } =
    useViewerContext();

  // Load state just once on initial render.
  // After the initial load, Calculator component owns the state and pushes it to ViewerContext.
  const [savedState] = useState<CalculatorState | undefined>(() => {
    const itemState = getLocalItemState({ path });

    const sameCalculatorCacheExists =
      itemState.calculator &&
      itemState.calculator.hashString === calculatorValue.value.hashString;

    if (sameCalculatorCacheExists) {
      return itemState.calculator;
    } else {
      return undefined;
    }
  });

  const updateSavedState = useCallback(
    (state: CalculatorState) => {
      viewerContextDispatch({
        type: "CALCULATOR_UPDATE",
        payload: {
          path,
          calculator: state,
        },
      });
    },
    [path, viewerContextDispatch]
  );

  return [savedState, updateSavedState] as const;
}
