import * as React from "react";
import {
  squiggleExpression,
  environment,
  declaration,
} from "@quri/squiggle-lang";
import { NumberShower } from "./NumberShower";
import { DistributionChart } from "./DistributionChart";
import { FunctionChart, FunctionChartSettings } from "./FunctionChart";

function getRange<a>(x: declaration<a>) {
  const first = x.args[0];
  switch (first.tag) {
    case "Float": {
      return { floats: { min: first.value.min, max: first.value.max } };
    }
    case "Date": {
      return { time: { min: first.value.min, max: first.value.max } };
    }
  }
}

function getChartSettings<a>(x: declaration<a>): FunctionChartSettings {
  const range = getRange(x);
  const min = range.floats ? range.floats.min : 0;
  const max = range.floats ? range.floats.max : 10;
  return {
    start: min,
    stop: max,
    count: 20,
  };
}

interface VariableBoxProps {
  heading: string;
  children: React.ReactNode;
  showTypes: boolean;
}

export const VariableBox: React.FC<VariableBoxProps> = ({
  heading = "Error",
  children,
  showTypes = false,
}) => {
  if (showTypes) {
    return (
      <div className="bg-white border border-grey-200 m-2">
        <div className="border-b border-grey-200 p-3">
          <header className="font-mono">{heading}</header>
        </div>
        <div className="p-3">{children}</div>
      </div>
    );
  } else {
    return <div>{children}</div>;
  }
};

export interface SquiggleItemProps {
  /** The input string for squiggle */
  expression: squiggleExpression;
  width?: number;
  height: number;
  /** Whether to show a summary of statistics for distributions */
  showSummary: boolean;
  /** Whether to show type information */
  showTypes: boolean;
  /** Whether to show users graph controls (scale etc) */
  showControls: boolean;
  /** Settings for displaying functions */
  chartSettings: FunctionChartSettings;
  /** Environment for further function executions */
  environment: environment;
}

export const SquiggleItem: React.FC<SquiggleItemProps> = ({
  expression,
  width,
  height,
  showSummary,
  showTypes = false,
  showControls = false,
  chartSettings,
  environment,
}) => {
  switch (expression.tag) {
    case "number":
      return (
        <VariableBox heading="Number" showTypes={showTypes}>
          <div className="font-semibold text-slate-600">
            <NumberShower precision={3} number={expression.value} />
          </div>
        </VariableBox>
      );
    case "distribution": {
      const distType = expression.value.type();
      return (
        <VariableBox
          heading={`Distribution (${distType})`}
          showTypes={showTypes}
        >
          {distType === "Symbolic" && showTypes ? (
            <div>{expression.value.toString()}</div>
          ) : null}
          <DistributionChart
            distribution={expression.value}
            height={height}
            width={width}
            showSummary={showSummary}
            showControls={showControls}
          />
        </VariableBox>
      );
    }
    case "string":
      return (
        <VariableBox heading="String" showTypes={showTypes}>
          <span className="text-slate-400">"</span>
          <span className="text-slate-600 font-semibold">
            {expression.value}
          </span>
          <span className="text-slate-400">"</span>
        </VariableBox>
      );
    case "boolean":
      return (
        <VariableBox heading="Boolean" showTypes={showTypes}>
          {expression.value.toString()}
        </VariableBox>
      );
    case "symbol":
      return (
        <VariableBox heading="Symbol" showTypes={showTypes}>
          <span className="text-slate-500 mr-2">Undefined Symbol:</span>
          <span className="text-slate-600">{expression.value}</span>
        </VariableBox>
      );
    case "call":
      return (
        <VariableBox heading="Call" showTypes={showTypes}>
          {expression.value}
        </VariableBox>
      );
    case "array":
      return (
        <VariableBox heading="Array" showTypes={showTypes}>
          {expression.value.map((r, i) => (
            <div key={i} className="flex pt-1">
              <div className="flex-none bg-slate-100 rounded-sm px-1">
                <header className="text-slate-400 font-mono">{i}</header>
              </div>
              <div className="px-2 mb-2 grow">
                <SquiggleItem
                  key={i}
                  expression={r}
                  width={width !== undefined ? width - 20 : width}
                  height={50}
                  showTypes={showTypes}
                  showControls={showControls}
                  chartSettings={chartSettings}
                  environment={environment}
                  showSummary={showSummary}
                />
              </div>
            </div>
          ))}
        </VariableBox>
      );
    case "record":
      return (
        <VariableBox heading="Record" showTypes={showTypes}>
          <div className="space-y-3">
            {Object.entries(expression.value).map(([key, r]) => (
              <div key={key} className="flex space-x-2">
                <div className="flex-none">
                  <header className="text-slate-500 font-mono">{key}:</header>
                </div>
                <div className="px-2 grow bg-gray-50 border border-gray-100 rounded-sm">
                  <SquiggleItem
                    expression={r}
                    width={width !== undefined ? width - 20 : width}
                    height={height / 3}
                    showTypes={showTypes}
                    showSummary={showSummary}
                    showControls={showControls}
                    chartSettings={chartSettings}
                    environment={environment}
                  />
                </div>
              </div>
            ))}
          </div>
        </VariableBox>
      );
    case "arraystring":
      return (
        <VariableBox heading="Array String" showTypes={showTypes}>
          {expression.value.map((r) => `"${r}"`).join(", ")}
        </VariableBox>
      );
    case "date":
      return (
        <VariableBox heading="Date" showTypes={showTypes}>
          {expression.value.toDateString()}
        </VariableBox>
      );
    case "timeDuration": {
      return (
        <VariableBox heading="Time Duration" showTypes={showTypes}>
          <NumberShower precision={3} number={expression.value} />
        </VariableBox>
      );
    }
    case "lambda":
      return (
        <VariableBox heading="Function" showTypes={showTypes}>
          <div className="text-amber-700 bg-amber-100 rounded-md font-mono p-1 pl-2 mb-3 mt-1 text-sm">{`function(${expression.value.parameters.join(
            ","
          )})`}</div>
          <FunctionChart
            fn={expression.value}
            chartSettings={chartSettings}
            height={height}
            environment={{
              sampleCount: environment.sampleCount / 10,
              xyPointLength: environment.xyPointLength / 10,
            }}
          />
        </VariableBox>
      );
    case "lambdaDeclaration": {
      return (
        <VariableBox heading="Function Declaration" showTypes={showTypes}>
          <FunctionChart
            fn={expression.value.fn}
            chartSettings={getChartSettings(expression.value)}
            height={height}
            environment={{
              sampleCount: environment.sampleCount / 10,
              xyPointLength: environment.xyPointLength / 10,
            }}
          />
        </VariableBox>
      );
    }
    case "module": {
      return (
        <VariableBox heading="Module" showTypes={showTypes}>
          <span className="text-slate-600 font-semibold">Internal Module</span>
        </VariableBox>
      );
    }
    default: {
      return (
        <>
          <span>No display for type: </span>{" "}
          <span className="font-semibold text-slate-600">{expression.tag}</span>
        </>
      );
    }
  }
};
