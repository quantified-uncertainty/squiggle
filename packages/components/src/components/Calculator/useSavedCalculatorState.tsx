import { useCallback, useMemo, useState } from "react";

import { useViewerContext } from "../SquiggleViewer/ViewerProvider.js";
import { SqCalculatorValueWithContext } from "./types.js";
import { SqValueResult } from "./types.js";
import { FormShape } from "./types.js";
import { InputValues } from "./types.js";

export type CalculatorState = {
  hashString: string;
  formValues?: FormShape;
  inputValues?: InputValues;
  fnValue?: SqValueResult;
};

// Takes a calculator value; returns the cache from ViewerContext for this calculator and a function for updating the cache.
// Note that the returned cached value is never updated! It's write-only after the initial load.
export function useSavedCalculatorState(
  calculatorValue: SqCalculatorValueWithContext
) {
  const path = useMemo(() => calculatorValue.context.path, [calculatorValue]);

  const { getLocalItemState, dispatch: viewerContextDispatch } =
    useViewerContext();

  // Load cache just once on initial render.
  // After the initial load, this component owns the state and pushes it to ViewerContext.
  const [cachedState] = useState<CalculatorState | undefined>(() => {
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

  const updateCachedState = useCallback(
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

  return [cachedState, updateCachedState] as const;
} // This type is used for backing up calculator state to ViewerContext.
