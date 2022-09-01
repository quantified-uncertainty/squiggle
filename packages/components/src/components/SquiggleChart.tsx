import * as React from "react";
import {
  SqValue,
  environment,
  defaultEnvironment,
  resultMap,
  SqValueTag,
} from "@quri/squiggle-lang";
import { useSquiggle } from "../lib/hooks";
import { SquiggleViewer } from "./SquiggleViewer";
import { JsImports } from "../lib/jsImports";

export interface SquiggleChartProps {
  /** The input string for squiggle */
  code?: string;
  /** Allows to re-run the code if code hasn't changed */
  executionId?: number;
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
  onChange?(expr: SqValue | undefined): void;
  /** CSS width of the element */
  width?: number;
  height?: number;
  /** JS imported parameters */
  jsImports?: JsImports;
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
const defaultImports: JsImports = {};

export const SquiggleChart: React.FC<SquiggleChartProps> = React.memo(
  ({
    code = "",
    executionId = 0,
    environment,
    onChange = defaultOnChange, // defaultOnChange must be constant, don't move its definition here
    height = 200,
    jsImports = defaultImports,
    showSummary = false,
    width,
    logX = false,
    expY = false,
    diagramStart = 0,
    diagramStop = 10,
    diagramCount = 20,
    tickFormat,
    minX,
    maxX,
    color,
    title,
    distributionChartActions,
    enableLocalSettings = false,
  }) => {
    const { result, bindings } = useSquiggle({
      code,
      environment,
      jsImports,
      onChange,
      executionId,
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

    const resultToRender = resultMap(result, (value) =>
      value.tag === SqValueTag.Void ? bindings.asValue() : value
    );

    return (
      <SquiggleViewer
        result={resultToRender}
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
