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
import { LayoutGroup, motion } from "framer-motion";

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
  showTypes: boolean;
}

const VariableBox: React.FC<VariableBoxProps> = ({
  name,
  heading = "Error",
  children,
  showTypes = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <motion.div layout transition={{ type: "tween" }}>
      {name || showTypes ? (
        <motion.header
          layout="position"
          transition={{ type: "tween" }}
          className="inline-flex space-x-1 text-slate-500 font-mono text-sm cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {name ? <span>{name}:</span> : null}
          {showTypes ? <span>{heading}</span> : null}
          {isCollapsed ? (
            <span className="bg-slate-200 rounded p-0.5 font-xs">...</span>
          ) : null}
        </motion.header>
      ) : null}
      {isCollapsed ? null : (
        <motion.div layout="position" transition={{ type: "tween" }}>
          {children}
        </motion.div>
      )}
    </motion.div>
  );
};

const VariableList: React.FC<{
  name?: string;
  heading: string;
  showTypes: boolean;
  children: React.ReactNode;
}> = ({ name, heading, showTypes, children }) => (
  <VariableBox name={name} heading={heading} showTypes={showTypes}>
    <motion.div
      layout="position"
      transition={{ type: "tween" }}
      className={clsx(
        "space-y-3",
        name ? "border-l pl-4" : null,
        name || showTypes ? "pt-1 mt-1" : null
      )}
    >
      <LayoutGroup>{children}</LayoutGroup>
    </motion.div>
  </VariableBox>
);

export interface SquiggleItemProps {
  /** The output of squiggle's run */
  expression: squiggleExpression;
  name?: string;
  width?: number;
  height: number;
  distributionPlotSettings: DistributionPlottingSettings;
  /** Whether to show type information */
  showTypes: boolean;
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
  showTypes = false,
  chartSettings,
  environment,
}) => {
  switch (expression.tag) {
    case "number":
      return (
        <VariableBox name={name} heading="Number" showTypes={showTypes}>
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
          heading={`Distribution (${distType})`}
          showTypes={showTypes}
        >
          {distType === "Symbolic" && showTypes ? (
            <div>{expression.value.toString()}</div>
          ) : null}
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
        <VariableBox name={name} heading="String" showTypes={showTypes}>
          <span className="text-slate-400">"</span>
          <span className="text-slate-600 font-semibold font-mono">
            {expression.value}
          </span>
          <span className="text-slate-400">"</span>
        </VariableBox>
      );
    case "boolean":
      return (
        <VariableBox name={name} heading="Boolean" showTypes={showTypes}>
          {expression.value.toString()}
        </VariableBox>
      );
    case "symbol":
      return (
        <VariableBox name={name} heading="Symbol" showTypes={showTypes}>
          <span className="text-slate-500 mr-2">Undefined Symbol:</span>
          <span className="text-slate-600">{expression.value}</span>
        </VariableBox>
      );
    case "call":
      return (
        <VariableBox name={name} heading="Call" showTypes={showTypes}>
          {expression.value}
        </VariableBox>
      );
    case "arraystring":
      return (
        <VariableBox name={name} heading="Array String" showTypes={showTypes}>
          {expression.value.map((r) => `"${r}"`).join(", ")}
        </VariableBox>
      );
    case "date":
      return (
        <VariableBox name={name} heading="Date" showTypes={showTypes}>
          {expression.value.toDateString()}
        </VariableBox>
      );
    case "timeDuration": {
      return (
        <VariableBox name={name} heading="Time Duration" showTypes={showTypes}>
          <NumberShower precision={3} number={expression.value} />
        </VariableBox>
      );
    }
    case "lambda":
      return (
        <VariableBox name={name} heading="Function" showTypes={showTypes}>
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
        <VariableBox
          name={name}
          heading="Function Declaration"
          showTypes={showTypes}
        >
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
        <VariableList name={name} heading="Module" showTypes={showTypes}>
          {Object.entries(expression.value)
            .filter(([key, r]) => key !== "Math")
            .map(([key, r]) => (
              <SquiggleItem
                key={key}
                name={key}
                expression={r}
                width={width !== undefined ? width - 20 : width}
                height={height / 3}
                showTypes={showTypes}
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
        <VariableList name={name} heading="Record" showTypes={showTypes}>
          {Object.entries(expression.value).map(([key, r]) => (
            <SquiggleItem
              key={key}
              name={key}
              expression={r}
              width={width !== undefined ? width - 20 : width}
              height={height / 3}
              showTypes={showTypes}
              distributionPlotSettings={distributionPlotSettings}
              chartSettings={chartSettings}
              environment={environment}
            />
          ))}
        </VariableList>
      );
    case "array":
      return (
        <VariableList name={name} heading="Array" showTypes={showTypes}>
          {expression.value.map((r, i) => (
            <SquiggleItem
              key={i}
              name={String(i)}
              expression={r}
              width={width !== undefined ? width - 20 : width}
              height={50}
              distributionPlotSettings={distributionPlotSettings}
              showTypes={showTypes}
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
