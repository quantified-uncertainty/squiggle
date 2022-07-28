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
import { FunctionSettings, functionSettingsFromPartial } from "./FunctionChart";
import { PlotSettings, plotSettingsFromPartial } from "./DistributionChart";

export interface SquiggleChartProps {
  /** The input string for squiggle */
  code?: string;
  /** Allows to re-run the code if code hasn't changed */
  executionId?: number;
  /** If the output requires monte carlo sampling, the amount of samples */
  sampleCount?: number;
  /** The amount of points returned to draw the distribution */
  environment?: environment;
  plotSettings?: PlotSettings;
  functionSettings?: FunctionSettings;
  /** When the squiggle code gets reevaluated */
  onChange?(expr: squiggleExpression | undefined): void;
  /** CSS width of the element */
  width?: number;
  height?: number;
  /** Bindings of previous variables declared */
  bindings?: bindings;
  /** JS imported parameters */
  jsImports?: jsImports;
  enableLocalSettings?: boolean;
}

const defaultOnChange = () => {};

export const SquiggleChart: React.FC<SquiggleChartProps> = React.memo(
  ({
    code = "",
    executionId = 0,
    environment,
    onChange = defaultOnChange, // defaultOnChange must be constant, don't move its definition here
    height = 200,
    bindings = defaultBindings,
    jsImports = defaultImports,
    width,
    functionSettings,
    plotSettings,
    enableLocalSettings = false,
  }) => {
    const result = useSquiggle({
      code,
      bindings,
      environment,
      jsImports,
      onChange,
      executionId,
    });

    return (
      <SquiggleViewer
        result={result}
        width={width}
        height={height}
        plotSettings={plotSettingsFromPartial(plotSettings || {})}
        functionSettings={functionSettingsFromPartial(functionSettings || {})}
        environment={environment ?? defaultEnvironment}
        enableLocalSettings={enableLocalSettings}
      />
    );
  }
);
