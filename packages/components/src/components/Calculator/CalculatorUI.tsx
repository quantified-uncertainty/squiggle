import { FC } from "react";
import ReactMarkdown from "react-markdown";
import Select from "react-select";

import {
  SqCalculator,
  SqError,
  SqInput,
  SqValue,
  result,
} from "@quri/squiggle-lang";
import { StyledCheckbox, StyledInput, StyledTextArea } from "@quri/ui";

import { valueHasContext } from "../../lib/utility.js";
import { PlaygroundSettings } from "../PlaygroundSettings.js";

import { getWidget } from "../SquiggleViewer/getWidget.js";
import { CalculatorState } from "./calculatorReducer.js";

type UIProps = {
  calculator: SqCalculator;
  settings: PlaygroundSettings;
  calculatorState: CalculatorState;
  onChange: (name: string, code: string) => void;
};

const showSqValue = (
  item: result<SqValue, SqError>,
  settings: PlaygroundSettings
) => {
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
};

const CalculatorInput: FC<
  { input: SqInput } & Pick<
    UIProps,
    "settings" | "onChange" | "calculatorState"
  >
> = ({ input, settings, onChange, calculatorState }) => {
  const { name, description } = input;
  const inputState = calculatorState.inputs[name];
  if (!inputState) {
    return null;
  }

  const { value: result, code } = inputState;
  const resultHasInterestingError = result && !result.ok && code !== "";
  return (
    <div className="flex flex-col mb-2">
      <div className="text-sm font-medium text-gray-800">{name}</div>
      {description && (
        <div className="text-sm text-gray-400">{description}</div>
      )}

      <div className="flex-grow mt-1 max-w-xs">
        {input.tag === "text" && (
          <StyledInput
            value={code || ""}
            onChange={(e) => onChange(name, e.target.value)}
            placeholder={`Enter code for ${name}`}
            size="small"
          />
        )}
        {input.tag === "textArea" && (
          <StyledTextArea
            value={code || ""}
            onChange={(e) => onChange(name, e.target.value)}
            placeholder={`Enter code for ${name}`}
          />
        )}
        {input.tag === "checkbox" && (
          <StyledCheckbox
            checked={(code || "false") == "false"}
            onChange={(e) => onChange(name, e.target.checked.toString())}
          />
        )}
        {input.tag === "select" && (
          <Select
            onChange={(option) => onChange(name, option ? option.value : "")}
            value={{ value: code, label: code }}
            options={input.options.map((option) => ({
              value: option,
              label: option,
            }))}
            styles={{
              input: (base) => ({
                ...base,
                "input:focus": {
                  boxShadow: "none",
                },
                className: "text-sm placeholder:text-slate-300",
              }),
              control: (provided, state) => ({
                ...provided,
                minHeight: "10px",
                height: "34px",
                borderColor: state.isFocused ? "#6610f2" : provided.borderColor,
                "&:hover": {
                  borderColor: state.isFocused
                    ? "#6610f2"
                    : provided.borderColor,
                },
                borderRadius: "0.375rem",
              }),
              option: (provided) => ({
                ...provided,
                fontSize: "0.875rem",
              }),
              placeholder: (provided) => ({
                ...provided,
                color: "#93C5FD",
              }),
            }}
          />
        )}
      </div>
      <div>
        {result && resultHasInterestingError && showSqValue(result, settings)}
        {!result && <div className="text-sm text-gray-500">No result</div>}
      </div>
    </div>
  );
};

export const CalculatorUI: FC<UIProps> = ({
  settings,
  calculator,
  calculatorState,
  onChange,
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
              onChange={onChange}
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
