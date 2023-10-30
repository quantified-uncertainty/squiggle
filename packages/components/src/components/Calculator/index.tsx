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

import {
  alterCodeForSquiggleRun,
  defaultAsString,
} from "../../lib/inputUtils.js";
import { SqValueWithContext } from "../../lib/utility.js";
import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { useViewerContext } from "../SquiggleViewer/ViewerProvider.js";
import { CalculatorInput } from "./CalculatorInput.js";
import { ValueResultViewer } from "./ValueResultViewer.js";

export type SqValueResult = result<SqValue, SqError>;

async function runSquiggleCode(
  code: string,
  environment: Env
): Promise<SqValueResult> {
  const project = SqProject.create();
  if (environment) {
    project.setEnvironment(environment);
  }
  const sourceId = "calculator";
  project.setSource(sourceId, code);
  await project.run(sourceId);
  return project.getResult(sourceId);
}

function modifyCode(
  name: string,
  calculator: SqCalculator,
  code: string
): string {
  const input = calculator.inputs.find((row) => row.name === name);
  if (!input) {
    throw new Error("Invalid input name.");
  }
  return alterCodeForSquiggleRun(input, code);
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

export type CalculatorState = {
  hashString: string;
  codes: Record<string, string>;
  inputValues: Record<string, SqValueResult>;
  fnValue: SqValueResult | undefined;
};

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

  const inputNames = useMemo(
    () => calculator.inputs.map((row) => row.name),
    [calculator]
  );

  const path = useMemo(() => valueWithContext.context.path, [valueWithContext]);

  const { getLocalItemState, dispatch: viewerContextDispatch } =
    useViewerContext();
  // Load just once on initial render, after the initial load, this component owns the state and pushes it to ViewerContext.
  const [cachedState] = useState<CalculatorState | undefined>(() => {
    const itemState = getLocalItemState({ path });

    const sameCalculatorCacheExists =
      itemState.calculator &&
      itemState.calculator.hashString === calculator.hashString;

    if (sameCalculatorCacheExists) {
      return itemState.calculator;
    } else {
      return undefined;
    }
  });

  const form = useForm({
    defaultValues: cachedState?.codes ?? getFormValues(calculator),
  });

  const [inputValues, setInputValues] = useState<Record<string, SqValueResult>>(
    () => cachedState?.inputValues ?? {}
  );

  // Takes all input codes and runs them all.  All values are updated simultaneously, to avoid too many rerenders.
  const processAllFieldCodes = useCallback(async () => {
    const codes = form.getValues();
    const newInputValues: typeof inputValues = {};
    for (const name of inputNames) {
      const code = codes[name];
      const valueResult = await runSquiggleCode(
        modifyCode(name, calculator, code),
        environment
      );
      newInputValues[name] = valueResult;
    }
    setInputValues(newInputValues);
  }, [calculator, environment, form, inputNames]);

  const hashString = useMemo(() => calculator.hashString, [calculator]);
  const [prevHashString, setPrevHashString] = useState<string | undefined>();

  // We want to reset the form and calculated values if the calculator changes.
  useEffect(() => {
    processAllFieldCodes();
    if (prevHashString && prevHashString !== hashString) {
      form.reset(getFormValues(calculator));
    }
    setPrevHashString(hashString);
    // dependencies are intentionally incomplete; we don't want to process codes on unrelated changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashString]);

  // Update input value based on input code.
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === undefined) return;
      const inputValue = value[name];
      if (inputValue === undefined) return;

      runSquiggleCode(
        modifyCode(name, calculator, inputValue),
        environment
      ).then((valueResult) => {
        setInputValues((inputValues) => ({
          ...inputValues,
          [name]: valueResult,
        }));
      });
    });

    return () => subscription.unsubscribe();
  }, [calculator, environment, form, form.watch]);

  const [fnValue, setFnValue] = useState<SqValueResult | undefined>(
    () => cachedState?.fnValue
  );

  // Store calculator state in ViewerContext, since calculator can disappear on code changes.
  const backupState = useCallback(() => {
    viewerContextDispatch({
      type: "CALCULATOR_UPDATE",
      payload: {
        path,
        calculator: {
          hashString,
          codes: form.getValues(),
          inputValues,
          fnValue,
        },
      },
    });
  }, [fnValue, inputValues, path, viewerContextDispatch, form, hashString]);

  // Backup whenever any calculated value changes.
  useEffect(() => {
    backupState();
  }, [backupState]);

  // Also backup whenever form state changes (backups are cheap).
  useEffect(() => {
    const subscription = form.watch(() => {
      backupState();
    });

    return () => subscription.unsubscribe();
  }, [backupState, form]);

  // Whenever inputValues change, we recalculate fnValue.
  useEffect(() => {
    const allFields = inputNames.map((name) => inputValues[name]);
    const allFieldValuesAreValid = allFields.every((result) => result?.ok);

    let finalResult: SqValueResult | undefined;
    if (allFieldValuesAreValid) {
      const results: SqValue[] = allFields.map((result) => {
        if (result && result.ok) {
          return result.value;
        } else {
          throw new Error("Invalid result encountered.");
        }
      });
      finalResult = calculator.run(results, environment);
    }

    setFnValue(finalResult);
  }, [calculator, inputNames, environment, inputValues]);

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
          {calculator.inputs.map((row) => {
            return (
              <CalculatorInput
                key={row.name}
                input={row}
                result={inputValues[row.name]}
                settings={inputShowSettings}
              />
            );
          })}
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
