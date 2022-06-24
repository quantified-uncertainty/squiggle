import * as React from "react";
import {
  squiggleExpression,
  bindings,
  environment,
  jsImports,
  defaultImports,
  defaultBindings,
  defaultEnvironment,
} from "@quri/squiggle-lang";
import { useSquiggle } from "../lib/hooks";
import { SquiggleErrorAlert } from "./SquiggleErrorAlert";
import { SquiggleItem } from "./SquiggleItem";

export interface SquiggleChartProps {
  /** The input string for squiggle */
  squiggleString?: string;
  /** If the output requires monte carlo sampling, the amount of samples */
  sampleCount?: number;
  /** The amount of points returned to draw the distribution */
  environment?: environment;
  /** If the result is a function, where the function domain starts */
  diagramStart?: number;
  /** If the result is a function, where the function domain ends */
  diagramStop?: number;
  /** If the result is a function, the amount of stops sampled */
  diagramCount?: number;
  /** When the squiggle code gets reevaluated */
  onChange?(expr: squiggleExpression | undefined): void;
  /** CSS width of the element */
  width?: number;
  height?: number;
  /** Bindings of previous variables declared */
  bindings?: bindings;
  /** JS imported parameters */
  jsImports?: jsImports;
  /** Whether to show a summary of the distribution */
  showSummary?: boolean;
  /** Whether to show type information about returns, default false */
  showTypes?: boolean;
  /** Whether to show graph controls (scale etc)*/
  showControls?: boolean;
  /** Set the x scale to be logarithmic by deault */
  logX?: boolean;
  /** Set the y scale to be exponential by deault */
  expY?: boolean;
}

const defaultOnChange = () => {};

export const SquiggleChart: React.FC<SquiggleChartProps> = ({
  squiggleString = "",
  environment,
  onChange = defaultOnChange, // defaultOnChange must be constant, don't move its definition here
  height = 200,
  bindings = defaultBindings,
  jsImports = defaultImports,
  showSummary = false,
  width,
  showTypes = false,
  showControls = false,
  logX = false,
  expY = false,
  diagramStart = 0,
  diagramStop = 10,
  diagramCount = 100,
}) => {
  const result = useSquiggle({
    code: squiggleString,
    bindings,
    environment,
    jsImports,
    onChange,
  });

  if (result.tag !== "Ok") {
    return <SquiggleErrorAlert error={result.value} />;
  }

  let distributionPlotSettings = {
    showControls,
    showSummary,
    logX,
    expY,
  };

  let chartSettings = {
    start: diagramStart,
    stop: diagramStop,
    count: diagramCount,
  };

  return (
    <SquiggleItem
      expression={result.value}
      width={width}
      height={height}
      distributionPlotSettings={distributionPlotSettings}
      showTypes={showTypes}
      chartSettings={chartSettings}
      environment={environment ?? defaultEnvironment}
    />
  );
};
