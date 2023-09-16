import React, { FC, ReactNode } from "react";

import { SqValue, SqCalculator, SqError, result } from "@quri/squiggle-lang";

import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { SqValueWithContext, valueHasContext } from "../../lib/utility.js";

import ReactMarkdown from "react-markdown";

import { StyledInput } from "@quri/ui";
import { CalculatorState } from "./calculatorReducer.js";

type UIProps = {
  calculator: SqCalculator;
  settings: PlaygroundSettings;
  renderValue: (
    value: SqValueWithContext,
    settings: PlaygroundSettings
  ) => ReactNode;
  calculatorState: CalculatorState;
  onChange: (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const showSqValue = (
  renderValue: (
    value: SqValueWithContext,
    settings: PlaygroundSettings
  ) => ReactNode,
  item: result<SqValue, SqError>,
  settings: PlaygroundSettings
) => {
  if (item.ok) {
    const value = item.value;
    if (valueHasContext(value)) {
      return renderValue(value, settings);
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

export const CalculatorUI: FC<UIProps> = ({
  renderValue,
  settings,
  calculator,
  calculatorState,
  onChange,
}) => {
  const fieldShowSettings: PlaygroundSettings = {
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

  return (
    <div className="relative space-y-4">
      {calculator.description && (
        <ReactMarkdown className={"prose text-sm text-slate-800 bg-opacity-60"}>
          {calculator.description}
        </ReactMarkdown>
      )}

      {calculator.fields.map((row) => {
        const { name, description } = row;
        const field = calculatorState.fields[name];
        if (field) {
          const { value, code } = field;
          const result = value;
          const resultHasInterestingError = result && !result.ok && code !== "";
          return (
            <div key={name} className="flex flex-col max-w-lg">
              <div className="text-sm font-semibold text-slate-800">{name}</div>
              {description && (
                <div className="text-sm  text-slate-600">{description}</div>
              )}
              <div className="flex-grow">
                <StyledInput
                  value={code || ""}
                  onChange={onChange(name)}
                  placeholder={`Enter code for ${name}`}
                />
              </div>
              <div>
                {result &&
                  resultHasInterestingError &&
                  showSqValue(renderValue, result, fieldShowSettings)}
                {!result && (
                  <div className="text-sm text-gray-500">No result</div>
                )}
              </div>
            </div>
          );
        }
      })}

      {calculatorState.fn.value && (
        <div>
          <div className="text-md font-bold text-slate-800">Result</div>
          {showSqValue(renderValue, calculatorState.fn.value, resultSettings)}
        </div>
      )}
    </div>
  );
};
