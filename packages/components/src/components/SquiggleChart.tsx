import * as React from "react";
import { SqValue, environment, SqProject } from "@quri/squiggle-lang";
import { useSquiggle } from "../lib/hooks";
import { SquiggleViewer } from "./SquiggleViewer";
import { JsImports } from "../lib/jsImports";
import { getValueToRender } from "../lib/utility";

export type SquiggleChartProps = {
  /** The input string for squiggle */
  code: string;
  /** Allows to re-run the code if code hasn't changed */
  executionId?: number;
  /** If the output requires monte carlo sampling, the amount of samples */
  sampleCount?: number;
  /** If the result is a function, where the function domain starts */
  diagramStart?: number;
  /** If the result is a function, where the function domain ends */
  diagramStop?: number;
  /** If the result is a function, the amount of stops sampled */
  diagramCount?: number;
  /** When the squiggle code gets reevaluated */
  onChange?(expr: SqValue | undefined, sourceName: string): void;
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
  /** Whether the x-axis should be dates or numbers */
  xAxisType?: "number" | "dateTime";
  /** Whether to show vega actions to the user, so they can copy the chart spec */
  distributionChartActions?: boolean;
  enableLocalSettings?: boolean;
  /** Precision to show numbers */
  numberPrecision?: number;
} & (StandaloneExecutionProps | ProjectExecutionProps);

// Props needed for a standalone execution
type StandaloneExecutionProps = {
  project?: undefined;
  continues?: undefined;
  /** The amount of points returned to draw the distribution, not needed if using a project */
  environment?: environment;
};

// Props needed when executing inside a project.
type ProjectExecutionProps = {
  environment?: undefined;
  /** The project that this execution is part of */
  project: SqProject;
  /** What other squiggle sources from the project to continue. Default [] */
  continues?: string[];
};
const defaultOnChange = () => {};
const defaultImports: JsImports = {};
const defaultContinues: string[] = [];

export const splitSquiggleChartSettings = (props: SquiggleChartProps) => {
  const {
    showSummary = false,
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
    xAxisType = "number",
    distributionChartActions,
  } = props;

  const distributionPlotSettings = {
    showSummary,
    logX,
    expY,
    format: tickFormat,
    minX,
    maxX,
    color,
    title,
    xAxisType,
    actions: distributionChartActions,
  };

  const chartSettings = {
    start: diagramStart,
    stop: diagramStop,
    count: diagramCount,
  };

  return { distributionPlotSettings, chartSettings };
};

export const SquiggleChart: React.FC<SquiggleChartProps> = React.memo(
  (props) => {
    const { distributionPlotSettings, chartSettings } =
      splitSquiggleChartSettings(props);

    const {
      code,
      jsImports = defaultImports,
      onChange = defaultOnChange, // defaultOnChange must be constant, don't move its definition here
      executionId = 0,
      width,
      height = 200,
      enableLocalSettings = false,
      continues = defaultContinues,
      numberPrecision,
    } = props;

    const p = React.useMemo(() => {
      if (props.project) {
        return props.project;
      } else {
        const p = SqProject.create();
        if (props.environment) {
          p.setEnvironment(props.environment);
        }
        return p;
      }
    }, [props.project, props.environment]);

    const resultAndBindings = useSquiggle({
      continues,
      project: p,
      code,
      jsImports,
      onChange,
      executionId,
    });

    const valueToRender = getValueToRender(resultAndBindings);

    return (
      <SquiggleViewer
        result={valueToRender}
        width={width}
        height={height}
        numberPrecision={numberPrecision}
        distributionPlotSettings={distributionPlotSettings}
        chartSettings={chartSettings}
        environment={p.getEnvironment()}
        enableLocalSettings={enableLocalSettings}
      />
    );
  }
);
