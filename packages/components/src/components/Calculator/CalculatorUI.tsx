import { FC } from "react";
import { useFormContext } from "react-hook-form";
import ReactMarkdown from "react-markdown";

import {
  SqCalculator,
  SqError,
  SqInput,
  SqValue,
  result,
} from "@quri/squiggle-lang";
import {
  CheckboxFormField,
  SelectStringFormField,
  TextAreaFormField,
  TextFormField,
} from "@quri/ui";

import { valueHasContext } from "../../lib/utility.js";
import { PlaygroundSettings } from "../PlaygroundSettings.js";

import { getWidget } from "../SquiggleViewer/getWidget.js";
import { CalculatorState } from "./calculatorReducer.js";

type UIProps = {
  calculator: SqCalculator;
  settings: PlaygroundSettings;
  calculatorState: CalculatorState;
};

function showSqValue(
  item: result<SqValue, SqError>,
  settings: PlaygroundSettings
) {
  if (item.ok) {
    const value = item.value;
    if (valueHasContext(value)) {
      return getWidget(value).render(settings);
    } else {
      return value.toString();
    }
  } else {
    return (
      <div className="text-sm text-red-800 text-opacity-70">
        {item.value.toString()}
      </div>
    );
  }
}

const CalculatorInput: FC<
  { input: SqInput } & Pick<UIProps, "settings" | "calculatorState">
> = ({ input, settings, calculatorState }) => {
  const form = useFormContext();
  const { name, description } = input;

  const inputState = calculatorState.inputs[name];
  if (!inputState) {
    return null;
  }

  const { value: result } = inputState;
  const code = form.getValues(input.name);

  return (
    <div className="flex flex-col mb-2">
      <div className="text-sm font-medium text-gray-800">{name}</div>
      {description && (
        <div className="text-sm text-gray-400">{description}</div>
      )}

      <div className="flex-grow mt-1 max-w-xs">
        {input.tag === "text" && (
          <TextFormField
            name={name}
            placeholder={`Enter code for ${name}`}
            size="small"
          />
        )}
        {input.tag === "textArea" && (
          <TextAreaFormField
            name={name}
            placeholder={`Enter code for ${name}`}
          />
        )}
        {input.tag === "checkbox" && <CheckboxFormField name={name} />}
        {input.tag === "select" && (
          <SelectStringFormField name={name} options={input.options} required />
        )}
      </div>
      {result && !result.ok && code !== "" && showSqValue(result, settings)}
    </div>
  );
};

export const CalculatorUI: FC<UIProps> = ({
  settings,
  calculator,
  calculatorState,
}) => {
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
    <div className="border border-slate-200 rounded-sm max-w-4xl mx-auto">
      {hasTitleOrDescription && (
        <div className="py-3 px-5 border-b border-slate-200 bg-slate-100 max-w-4xl">
          {calculator.title && (
            <div className={"text-lg text-slate-900 font-semibold mb-1"}>
              {calculator.title}
            </div>
          )}
          {calculator.description && (
            <ReactMarkdown className={"prose text-sm text-slate-700"}>
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
              settings={inputShowSettings}
              calculatorState={calculatorState}
            />
          );
        })}
      </div>

      {calculatorState.fn.value && (
        <div className="py-3 px-5">
          <div className="text-sm font-semibold text-gray-700 mb-2">Result</div>
          {showSqValue(calculatorState.fn.value, resultSettings)}
        </div>
      )}
    </div>
  );
};
