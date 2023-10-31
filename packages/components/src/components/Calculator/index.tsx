import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";

import {
  Env,
  SqCalculator,
  SqError,
  SqProject,
  SqValue,
  result,
} from "@quri/squiggle-lang";

import { SqValueWithContext } from "../../lib/utility.js";
import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { useViewerContext } from "../SquiggleViewer/ViewerProvider.js";
import { CalculatorInput } from "./CalculatorInput.js";
import { ValueResultViewer } from "./ValueResultViewer.js";

export type SqValueResult = result<SqValue, SqError>;

async function runSquiggleCode(
  code: string,
  environment: Env
): Promise<SqValueResult | undefined> {
  if (!code) {
    return undefined;
  }
  const project = SqProject.create();
  if (environment) {
    project.setEnvironment(environment);
  }
  const sourceId = "calculator";
  project.setSource(sourceId, code);
  await project.run(sourceId);
  return project.getResult(sourceId);
}

function fieldValueToCode(
  name: string,
  calculator: SqCalculator,
  fieldValue: string | boolean
): string {
  const input = calculator.inputs.find((row) => row.name === name);
  if (!input) {
    throw new Error("Invalid input name.");
  }
  if (typeof fieldValue === "boolean") {
    return fieldValue.toString();
  }

  if (input.tag === "select") {
    return `"${fieldValue}"`;
  } else {
    return fieldValue;
  }
}

type SqCalculatorValueWithContext = Extract<
  SqValueWithContext,
  { tag: "Calculator" }
>;

type Props = {
  environment: Env;
  settings: PlaygroundSettings;
  valueWithContext: SqCalculatorValueWithContext;
};

type FormShape = Record<string, string | boolean>;
type InputValues = Record<string, SqValueResult | undefined>;

// This type is used for backing up calculator state to ViewerContext.
export type CalculatorState = {
  hashString: string;
  formValues: FormShape;
  inputValues: InputValues;
  fnValue: SqValueResult | undefined;
};

// Takes a calculator value; returns the cache from ViewerContext for this calculator and a function for updating the cache.
// Note that the returned cached value is never updated! It's write-only after the initial load.
function useSavedCalculatorState(
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
}

function getFormValues(calculator: SqCalculator): FormShape {
  return Object.fromEntries(
    calculator.inputs.map((input) => [input.name, input.default ?? ""])
  );
}

/**
 * This function implements all state flow logic for <Calculator />.
 */
function useCalculator(
  valueWithContext: SqCalculatorValueWithContext,
  environment: Env
) {
  // useMemo here is important; valueWithContext.value is a getter that creates a new calculator value every time.
  const calculator = useMemo(() => valueWithContext.value, [valueWithContext]);

  const [cachedState, updateCachedState] =
    useSavedCalculatorState(valueWithContext);

  // Calculator input codes (Squiggle strings, selected options in <select>, etc.) are tracked by react-hook-form.
  // Everything else is tracked in local state and backed up to ViewerContext.
  const form = useForm<FormShape>({
    defaultValues: cachedState?.formValues ?? getFormValues(calculator),
  });

  const [inputValues, setInputValues] = useState<InputValues>(
    () => cachedState?.inputValues ?? {}
  );

  const hashString = useMemo(() => calculator.hashString, [calculator]);
  const [prevHashString, setPrevHashString] = useState<string | undefined>(
    cachedState?.hashString
  );

  // This effect does two things:
  // - when the calculator is updated, it resets the form
  // - also, on initial render and on calculator updates, it calculates all input values (which will trigger calculator result calculation)
  // In both cases, it updates `prevHashString`, which tracks the calculator identity.
  useEffect(() => {
    if (prevHashString === hashString) {
      return;
    }

    if (prevHashString) {
      // Calculator identity has changed. Let's reset the form because there might be new inputs or new defaults.
      // (In the future, we could do something more complicated here, for example check if any form fields were touched.)
      form.reset(getFormValues(calculator));
    }

    // Calculator has updated (or this component just mounted). Let's take all input codes and run them.
    const processAllFieldCodes = async () => {
      const formValues = form.getValues();
      const newInputValues: typeof inputValues = {};
      for (const input of calculator.inputs) {
        const name = input.name;
        const fieldValue = formValues[name];
        const inputValueResult = await runSquiggleCode(
          fieldValueToCode(name, calculator, fieldValue),
          environment
        );
        newInputValues[name] = inputValueResult;
      }
      // All values are updated simultaneously, to avoid too many rerenders.
      setInputValues(newInputValues);
    };
    processAllFieldCodes();

    setPrevHashString(hashString);
  }, [calculator, environment, hashString, prevHashString, form]);

  // Update input value if input code has changed.
  useEffect(() => {
    const subscription = form.watch(async (formValues, { name }) => {
      if (name === undefined) return;
      const fieldValue = formValues[name];
      if (fieldValue === undefined) return;

      const valueResult = await runSquiggleCode(
        fieldValueToCode(name, calculator, fieldValue),
        environment
      );
      setInputValues((inputValues) => ({
        ...inputValues,
        [name]: valueResult,
      }));
    });

    return () => subscription.unsubscribe();
  }, [calculator, environment, form]);

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

  // Back up calculator state outside of this component, since calculator can disappear on code changes,
  // (for example, on short syntax errors when autorun is enabled), and we don't want to lose user input
  // or calculator output when calculator component is rendered again.
  const backupState = useCallback(() => {
    updateCachedState({
      hashString,
      formValues: form.getValues(),
      inputValues,
      fnValue,
    });
  }, [fnValue, inputValues, form, hashString, updateCachedState]);

  // Back up whenever any calculated value changes.
  useEffect(() => backupState(), [backupState]);

  // Also back up whenever form state changes (backups are cheap, so there's no reason not to do this).
  useEffect(() => {
    const subscription = form.watch(() => backupState());

    return () => subscription.unsubscribe();
  }, [backupState, form]);

  return { calculator, form, inputValues, fnValue };
}

export const Calculator: FC<Props> = ({
  environment,
  settings,
  valueWithContext,
}) => {
  const { calculator, form, inputValues, fnValue } = useCalculator(
    valueWithContext,
    environment
  );

  const inputShowSettings: PlaygroundSettings = {
    ...settings,
    distributionChartSettings: {
      ...settings.distributionChartSettings,
      showSummary: false,
    },
    chartHeight: 30,
  };

  const resultSettings: PlaygroundSettings = {
    ...settings,
    chartHeight: 200,
  };

  const hasTitleOrDescription = !!calculator.title || !!calculator.description;
  return (
    <FormProvider {...form}>
      <div className="border border-slate-200 rounded-sm max-w-4xl mx-auto">
        {hasTitleOrDescription && (
          <div className="py-3 px-5 border-b border-slate-200 bg-slate-100 max-w-4xl">
            {calculator.title && (
              <div className="text-lg text-slate-900 font-semibold mb-1">
                {calculator.title}
              </div>
            )}
            {calculator.description && (
              <ReactMarkdown className="prose text-sm text-slate-700">
                {calculator.description}
              </ReactMarkdown>
            )}
          </div>
        )}

        <div className="py-3 px-5 border-b border-slate-200 bg-gray-50 space-y-3">
          {calculator.inputs.map((row) => (
            <CalculatorInput
              key={row.name}
              input={row}
              result={inputValues[row.name]}
              settings={inputShowSettings}
            />
          ))}
        </div>

        {fnValue && (
          <div className="py-3 px-5">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              Result
            </div>
            <ValueResultViewer result={fnValue} settings={resultSettings} />
          </div>
        )}
      </div>
    </FormProvider>
  );
};
