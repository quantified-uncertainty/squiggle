import React, { useState } from "react";
import {
  squiggleExpression,
  environment,
  declaration,
} from "@quri/squiggle-lang";
import { NumberShower } from "./NumberShower";
import {
  DistributionChart,
  DistributionPlottingSettings,
} from "./DistributionChart";
import { FunctionChart, FunctionChartSettings } from "./FunctionChart";
import clsx from "clsx";
import { Tooltip } from "./ui/Tooltip";

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
  name?: string;
  heading: string;
  children: React.ReactNode;
}

const VariableBox: React.FC<VariableBoxProps> = ({
  name,
  heading = "Error",
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div>
      <div>
        {name ? (
          <header
            className="inline-flex space-x-1 text-slate-500 font-mono text-sm cursor-pointer"
            onClick={toggleCollapsed}
          >
            {name ? (
              <Tooltip text={heading}>
                <span>{name}:</span>
              </Tooltip>
            ) : null}
            {isCollapsed ? (
              <span className="bg-slate-200 rounded p-0.5 font-xs">...</span>
            ) : null}
          </header>
        ) : null}
        {isCollapsed ? null : (
          <div className="flex w-full">
            {name ? (
              <div
                className="border-l-2 border-slate-200 hover:border-green-600 w-4 cursor-pointer"
                onClick={toggleCollapsed}
              ></div>
            ) : null}
            <div className="grow">{children}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const VariableList: React.FC<{
  name?: string;
  heading: string;
  children: React.ReactNode;
}> = ({ name, heading, children }) => (
  <VariableBox name={name} heading={heading}>
    <div className={clsx("space-y-3", name ? "pt-1 mt-1" : null)}>
      {children}
    </div>
  </VariableBox>
);

export interface SquiggleItemProps {
  /** The output of squiggle's run */
  expression: squiggleExpression;
  name?: string;
  width?: number;
  height: number;
  distributionPlotSettings: DistributionPlottingSettings;
  /** Settings for displaying functions */
  chartSettings: FunctionChartSettings;
  /** Environment for further function executions */
  environment: environment;
}

export const SquiggleItem: React.FC<SquiggleItemProps> = ({
  name,
  expression,
  width,
  height,
  distributionPlotSettings,
  chartSettings,
  environment,
}) => {
  switch (expression.tag) {
    case "number":
      return (
        <VariableBox name={name} heading="Number">
          <div className="font-semibold text-slate-600">
            <NumberShower precision={3} number={expression.value} />
          </div>
        </VariableBox>
      );
    case "distribution": {
      const distType = expression.value.type();
      return (
        <VariableBox
          name={name}
          heading={`Distribution (${distType})\n${
            distType === "Symbolic" ? expression.value.toString() : ""
          }`}
        >
          <DistributionChart
            distribution={expression.value}
            {...distributionPlotSettings}
            height={height}
            width={width}
          />
        </VariableBox>
      );
    }
    case "string":
      return (
        <VariableBox name={name} heading="String">
          <span className="text-slate-400">"</span>
          <span className="text-slate-600 font-semibold font-mono">
            {expression.value}
          </span>
          <span className="text-slate-400">"</span>
        </VariableBox>
      );
    case "boolean":
      return (
        <VariableBox name={name} heading="Boolean">
          {expression.value.toString()}
        </VariableBox>
      );
    case "symbol":
      return (
        <VariableBox name={name} heading="Symbol">
          <span className="text-slate-500 mr-2">Undefined Symbol:</span>
          <span className="text-slate-600">{expression.value}</span>
        </VariableBox>
      );
    case "call":
      return (
        <VariableBox name={name} heading="Call">
          {expression.value}
        </VariableBox>
      );
    case "arraystring":
      return (
        <VariableBox name={name} heading="Array String">
          {expression.value.map((r) => `"${r}"`).join(", ")}
        </VariableBox>
      );
    case "date":
      return (
        <VariableBox name={name} heading="Date">
          {expression.value.toDateString()}
        </VariableBox>
      );
    case "timeDuration": {
      return (
        <VariableBox name={name} heading="Time Duration">
          <NumberShower precision={3} number={expression.value} />
        </VariableBox>
      );
    }
    case "lambda":
      return (
        <VariableBox name={name} heading="Function">
          <div className="text-amber-700 bg-amber-100 rounded-md font-mono p-1 pl-2 mb-3 mt-1 text-sm">{`function(${expression.value.parameters.join(
            ","
          )})`}</div>
          <FunctionChart
            fn={expression.value}
            chartSettings={chartSettings}
            distributionPlotSettings={distributionPlotSettings}
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
        <VariableBox name={name} heading="Function Declaration">
          <FunctionChart
            fn={expression.value.fn}
            chartSettings={getChartSettings(expression.value)}
            distributionPlotSettings={distributionPlotSettings}
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
        <VariableList name={name} heading="Module">
          {Object.entries(expression.value)
            .filter(([key, r]) => key !== "Math")
            .map(([key, r]) => (
              <SquiggleItem
                key={key}
                name={key}
                expression={r}
                width={width !== undefined ? width - 20 : width}
                height={height / 3}
                distributionPlotSettings={distributionPlotSettings}
                chartSettings={chartSettings}
                environment={environment}
              />
            ))}
        </VariableList>
      );
    }
    case "record":
      return (
        <VariableList name={name} heading="Record">
          {Object.entries(expression.value).map(([key, r]) => (
            <SquiggleItem
              key={key}
              name={key}
              expression={r}
              width={width !== undefined ? width - 20 : width}
              height={height / 3}
              distributionPlotSettings={distributionPlotSettings}
              chartSettings={chartSettings}
              environment={environment}
            />
          ))}
        </VariableList>
      );
    case "array":
      return (
        <VariableList name={name} heading="Array">
          {expression.value.map((r, i) => (
            <SquiggleItem
              key={i}
              name={String(i)}
              expression={r}
              width={width !== undefined ? width - 20 : width}
              height={50}
              distributionPlotSettings={distributionPlotSettings}
              chartSettings={chartSettings}
              environment={environment}
            />
          ))}
        </VariableList>
      );
    default: {
      return (
        <div>
          <span>No display for type: </span>{" "}
          <span className="font-semibold text-slate-600">{expression.tag}</span>
        </div>
      );
    }
  }
};
