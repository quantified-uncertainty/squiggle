import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";

import { Env, SqCalculator, SqProject } from "@quri/squiggle-lang";

import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { CalculatorInput } from "./CalculatorInput.js";
import { CalculatorResult } from "./CalculatorResult.js";
import {
  FormShape,
  InputResults,
  SqCalculatorValueWithContext,
  SqValueResult,
} from "./types.js";
import { useSavedCalculatorState } from "./useSavedCalculatorState.js";
import { SAMPLE_COUNT_MAX, SAMPLE_COUNT_MIN } from "../../lib/constants.js";
import { ErrorAlert } from "../Alert.js";

const getEnvironment = (
  modelEnvironment: Env,
  calculator: SqCalculator
): Env => ({
  sampleCount: calculator.sampleCount || modelEnvironment.sampleCount,
  xyPointLength: modelEnvironment.xyPointLength,
});

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

function getFormValues(calculator: SqCalculator): FormShape {
  return Object.fromEntries(
    calculator.inputs.map((input) => [input.name, input.default ?? ""])
  );
}

/**
 * This function implements all state flow logic for calculator inputs.
 */
function useCalculator(
  valueWithContext: SqCalculatorValueWithContext,
  environment: Env
) {
  // useMemo here is important; valueWithContext.value is a getter that creates a new calculator value every time.
  const calculator = useMemo(() => valueWithContext.value, [valueWithContext]);

  const [savedState, updateSavedState] =
    useSavedCalculatorState(valueWithContext);

  // Calculator input codes (Squiggle strings, selected options in <select>, etc.) are tracked by react-hook-form.
  // Everything else is tracked in local state and backed up to ViewerContext.
  const form = useForm<FormShape>({
    defaultValues: savedState?.formValues ?? getFormValues(calculator),
  });

  const [inputResults, setInputResults] = useState<InputResults>(
    () => savedState?.inputResults ?? {}
  );

  const hashString = useMemo(() => calculator.hashString, [calculator]);
  const [prevHashString, setPrevHashString] = useState<string | undefined>(
    savedState?.hashString
  );

  const processAllFieldCodes = useCallback(async () => {
    const formValues = form.getValues();
    const newInputResults: typeof inputResults = {};
    for (const input of calculator.inputs) {
      const name = input.name;
      const fieldValue = formValues[name];
      const inputResult = await runSquiggleCode(
        fieldValueToCode(name, calculator, fieldValue),
        environment
      );
      newInputResults[name] = inputResult;
    }
    setInputResults(newInputResults);
  }, [calculator, environment, form, setInputResults]);

  // This effect does two things:
  // - when the calculator is updated, it resets the form
  // - also, on initial render and on calculator updates, it calculates all input results (which will trigger calculator result calculation)
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
    setPrevHashString(hashString);

    // Calculator has updated (or this component just mounted). Let's take all input codes and run them.
    processAllFieldCodes();
  }, [calculator, hashString, prevHashString, form, processAllFieldCodes]);

  // Update input result if input code has changed.
  useEffect(() => {
    const subscription = form.watch(async (formValues, { name }) => {
      if (name === undefined) return;
      const fieldValue = formValues[name];
      if (fieldValue === undefined) return;

      const inputResult = await runSquiggleCode(
        fieldValueToCode(name, calculator, fieldValue),
        environment
      );
      setInputResults((inputResults) => ({
        ...inputResults,
        [name]: inputResult,
      }));
    });

    return () => subscription.unsubscribe();
  }, [calculator, environment, form]);

  // Back up calculator state outside of this component, since calculator can disappear on code changes
  // (for example, on short syntax errors when autorun is enabled), and we don't want to lose user input
  // or calculator output when calculator component is rendered again.
  const _updateSavedState = useCallback(() => {
    updateSavedState({
      hashString,
      formValues: form.getValues(),
      inputResults: inputResults,
    });
  }, [inputResults, form, hashString, updateSavedState]);

  // Back up whenever any calculated input result changes.
  useEffect(() => _updateSavedState(), [_updateSavedState]);

  // Also back up whenever form state changes (backups are cheap, so there's no reason not to do this).
  useEffect(() => {
    const subscription = form.watch(() => _updateSavedState());
    return () => subscription.unsubscribe();
  }, [_updateSavedState, form]);

  return { calculator, form, inputResults, processAllFieldCodes };
}

type Props = {
  environment: Env;
  settings: PlaygroundSettings;
  valueWithContext: SqCalculatorValueWithContext;
};

export const CalculatorSampleCountValidation: React.FC<{
  calculator: SqCalculatorValueWithContext;
  children: React.ReactNode;
}> = ({ calculator, children }) => {
  const { sampleCount } = calculator.value;

  const sampleCountIsInvalid =
    sampleCount &&
    (sampleCount < SAMPLE_COUNT_MIN || sampleCount > SAMPLE_COUNT_MAX);

  return sampleCountIsInvalid ? (
    <ErrorAlert
      heading={`Calculator sampleCount must be between ${SAMPLE_COUNT_MIN} and ${SAMPLE_COUNT_MAX}. It is set to ${sampleCount}.`}
    />
  ) : (
    children
  );
};

export const Calculator: FC<Props> = ({
  environment,
  settings,
  valueWithContext,
}) => {
  const _environment = useMemo(
    () => getEnvironment(environment, valueWithContext.value),
    [environment, valueWithContext]
  );

  const { calculator, form, inputResults, processAllFieldCodes } =
    useCalculator(valueWithContext, _environment);

  const inputResultSettings: PlaygroundSettings = {
    ...settings,
    distributionChartSettings: {
      ...settings.distributionChartSettings,
      showSummary: false,
    },
    chartHeight: 30,
  };

  const calculatorResultSettings: PlaygroundSettings = {
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
              result={inputResults[row.name]}
              settings={inputResultSettings}
            />
          ))}
        </div>

        <CalculatorResult
          valueWithContext={valueWithContext}
          inputResults={inputResults}
          environment={_environment}
          processAllFieldCodes={processAllFieldCodes}
          autorun={calculator.autorun}
          settings={calculatorResultSettings}
        />
      </div>
    </FormProvider>
  );
};
