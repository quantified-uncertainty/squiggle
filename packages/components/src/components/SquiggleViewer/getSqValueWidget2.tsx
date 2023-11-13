import { clsx } from "clsx";
import { FC, ReactNode, useMemo } from "react";
import ReactMarkdown from "react-markdown";

import {
  SqDistributionsPlot,
  SqPlot,
  SqScale,
  SqTableChart,
} from "@quri/squiggle-lang";
import { TableCellsIcon } from "@quri/ui";

import { hasMassBelowZero } from "../../lib/distributionUtils.js";
import { SqValueWithContext } from "../../lib/utility.js";
import {
  Calculator,
  CalculatorSampleCountValidation,
} from "../Calculator/index.js";
import { DistPreview } from "../DistributionsChart/DistPreview.js";
import { DistributionsChart } from "../DistributionsChart/index.js";
import { DistFunctionChart } from "../FunctionChart/DistFunctionChart.js";
import { NumericFunctionChart } from "../FunctionChart/NumericFunctionChart.js";
import { FunctionChart } from "../FunctionChart/index.js";
import { NumberShower } from "../NumberShower.js";
import { generateDistributionPlotSettings } from "../PlaygroundSettings.js";
import { RelativeValuesGridChart } from "../RelativeValuesGridChart/index.js";
import { ScatterChart } from "../ScatterChart/index.js";
import { TableChart } from "../TableChart/index.js";
import { ItemSettingsMenu } from "./ItemSettingsMenu.js";
import { ValueViewer } from "./ValueViewer.js";
import { SettingsMenuParams } from "./ValueWithContextViewer.js";
import { MergedItemSettings, getChildrenValues } from "./utils.js";

// Distributions should be smaller than the other charts.
// Note that for distributions, this only applies to the internals, there's also extra margin and details.
const CHART_TO_DIST_HEIGHT_ADJUSTMENT = 0.5;

// We use an extra left margin for some elements to align them with parent variable name
const leftMargin = "ml-1.5";

const truncateStr = (str: string, maxLength: number) =>
  str.substring(0, maxLength) + (str.length > maxLength ? "..." : "");

export const SqTypeWithCount: FC<{
  type: string;
  count: number;
}> = ({ type, count }) => (
  <div>
    {type}
    <span className="ml-0.5">{count}</span>
  </div>
);

export type ValueWidget = {
  heading?: string;
  renderPreview?: () => ReactNode;
  renderSettingsMenu?: (params: SettingsMenuParams) => ReactNode;
  render: (settings: MergedItemSettings) => ReactNode;
};

export const GetSqValueWidget: FC<{
  value: SqValueWithContext;
  settings: MergedItemSettings;
}> = ({ value, settings }) => {
  const environment = value.context.project.getEnvironment();

  console.log(67);
  switch (value.tag) {
    case "Lambda":
      return (
        <FunctionChart
          fn={value.value}
          settings={settings}
          height={settings.chartHeight}
          environment={{
            sampleCount: environment.sampleCount / 10,
            xyPointLength: environment.xyPointLength / 10,
          }}
        />
      );
    default: {
      return (
        <div>
          <span>No display for type: </span>{" "}
          <span className="font-semibold text-neutral-600">
            {(value as { tag: string }).tag}
          </span>
        </div>
      );
    }
  }
};
