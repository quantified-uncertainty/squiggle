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
import { SquiggleViewer } from "./SquiggleViewer";

export interface SquiggleChartProps {
  /** The input string for squiggle */
  code?: string;
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
  /** Set the x scale to be logarithmic by deault */
  logX?: boolean;
  /** Set the y scale to be exponential by deault */
  expY?: boolean;
  /** How to format numbers on the x axis */
  tickFormat?: string;
  /** Title of the graphed distribution */
  title?: string;
  /** Color of the graphed distribution */
  color?: string;
  /** Specify the lower bound of the x scale */
  minX?: number;
  /** Specify the upper bound of the x scale */
  maxX?: number;
  /** Whether to show vega actions to the user, so they can copy the chart spec */
  distributionChartActions?: boolean;
  enableLocalSettings?: boolean;
}

const defaultOnChange = () => {};

export const SquiggleChart: React.FC<SquiggleChartProps> = React.memo(
  ({
    code = "",
    environment,
    onChange = defaultOnChange, // defaultOnChange must be constant, don't move its definition here
    height = 200,
    bindings = defaultBindings,
    jsImports = defaultImports,
    showSummary = false,
    width,
    logX = false,
    expY = false,
    diagramStart = 0,
    diagramStop = 10,
    diagramCount = 100,
    tickFormat,
    minX,
    maxX,
    color,
    title,
    distributionChartActions,
    enableLocalSettings = false,
  }) => {
    const result = useSquiggle({
      code,
      bindings,
      environment,
      jsImports,
      onChange,
    });

    const distributionPlotSettings = {
      showSummary,
      logX,
      expY,
      format: tickFormat,
      minX,
      maxX,
      color,
      title,
      actions: distributionChartActions,
    };

    const chartSettings = {
      start: diagramStart,
      stop: diagramStop,
      count: diagramCount,
    };

    return (
      <SquiggleViewer
        result={result}
        width={width}
        height={height}
        distributionPlotSettings={distributionPlotSettings}
        chartSettings={chartSettings}
        environment={environment ?? defaultEnvironment}
        enableLocalSettings={enableLocalSettings}
      />
    );
  }
);
