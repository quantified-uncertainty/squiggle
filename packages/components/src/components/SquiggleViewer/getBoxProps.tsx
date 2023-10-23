import { clsx } from "clsx";
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
import { Calculator } from "../Calculator/index.js";
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
import { SqTypeWithCount, VariableBoxProps } from "./VariableBox.js";
import { getChildrenValues } from "./utils.js";
import {
  leftMargin,
  CHART_TO_DIST_HEIGHT_ADJUSTMENT,
  truncateStr,
  ValueViewer,
} from "./ValueViewer.js";

export function getBoxProps(
  value: SqValueWithContext
): Omit<VariableBoxProps, "value"> {
  const environment = value.context.project.getEnvironment();

  switch (value.tag) {
    case "Number":
      return {
        preview: <NumberShower precision={4} number={value.value} />,
        children: () => (
          <div className={clsx("font-semibold text-indigo-800", leftMargin)}>
            <NumberShower precision={4} number={value.value} />
          </div>
        ),
      };
    case "Dist": {
      return {
        preview: <DistPreview dist={value.value} environment={environment} />,
        renderSettingsMenu: ({ onChange }) => {
          const shape = value.value.pointSet(
            value.context.project.getEnvironment()
          );

          return (
            <ItemSettingsMenu
              value={value}
              onChange={onChange}
              metaSettings={{
                disableLogX:
                  shape?.ok && hasMassBelowZero(shape.value.asShape()),
              }}
              withFunctionSettings={false}
            />
          );
        },
        children: (settings) => {
          const plot = SqDistributionsPlot.create({
            distribution: value.value,
            ...generateDistributionPlotSettings(
              settings.distributionChartSettings
            ),
          });

          return (
            <DistributionsChart
              plot={plot}
              environment={environment}
              height={settings.chartHeight * CHART_TO_DIST_HEIGHT_ADJUSTMENT}
            />
          );
        },
      };
    }
    case "String":
      return {
        preview: (
          <div className="overflow-ellipsis overflow-hidden">
            {truncateStr(value.value, 20)}
          </div>
        ),
        children: () => (
          <div className="text-neutral-800 text-sm px-2 py-1 my-1">
            <ReactMarkdown className="prose max-w-4xl">
              {value.value}
            </ReactMarkdown>
          </div>
        ),
      };
    case "Bool":
      return {
        preview: value.value.toString(),
        children: () => (
          <div
            className={clsx(
              "text-indigo-800 text-sm font-mono font-semibold",
              leftMargin
            )}
          >
            {value.value.toString()}
          </div>
        ),
      };
    case "Date":
      return {
        children: () => value.value.toDateString(),
      };
    case "Void":
      return {
        children: () => "Void",
      };
    case "TimeDuration": {
      return {
        children: () => <NumberShower precision={3} number={value.value} />,
      };
    }
    case "Calculator": {
      return {
        children: (settings) => (
          <Calculator
            valueWithContext={value}
            environment={environment}
            settings={settings}
            renderValue={(value, settings) =>
              getBoxProps(value).children(settings)
            }
          />
        ),
      };
    }
    case "TableChart": {
      const table: SqTableChart = value.value;
      return {
        preview: (
          <div className="items-center flex space-x-1">
            <TableCellsIcon size={14} className="flex opacity-60" />
            <div>
              {table.rowCount}
              <span className="opacity-60">x</span>
              {table.columnCount}
            </div>
          </div>
        ),
        children: (settings) => (
          <TableChart
            value={table}
            environment={environment}
            settings={settings}
            renderValue={(value, settings) =>
              getBoxProps(value).children(settings)
            }
          />
        ),
      };
    }
    case "Lambda":
      return {
        preview: (
          <div>
            fn(
            <span className="opacity-60">
              {truncateStr(value.value.parameterString(), 15)}
            </span>
            )
          </div>
        ),
        renderSettingsMenu: ({ onChange }) => {
          return (
            <ItemSettingsMenu
              value={value}
              onChange={onChange}
              withFunctionSettings={true}
            />
          );
        },
        children: (settings) => (
          <FunctionChart
            fn={value.value}
            settings={settings}
            height={settings.chartHeight}
            environment={{
              sampleCount: environment.sampleCount / 10,
              xyPointLength: environment.xyPointLength / 10,
            }}
          />
        ),
      };
    case "Plot": {
      const plot: SqPlot = value.value;
      return {
        children: (settings) => {
          switch (plot.tag) {
            case "distributions":
              return (
                <DistributionsChart
                  plot={plot}
                  environment={environment}
                  height={
                    settings.chartHeight * CHART_TO_DIST_HEIGHT_ADJUSTMENT
                  }
                />
              );
            case "numericFn": {
              return (
                <NumericFunctionChart
                  plot={plot}
                  environment={environment}
                  height={settings.chartHeight}
                />
              );
            }
            case "distFn": {
              return (
                <DistFunctionChart
                  plot={plot}
                  environment={{
                    sampleCount: environment.sampleCount / 10,
                    xyPointLength: environment.xyPointLength / 10,
                  }}
                  height={settings.chartHeight}
                />
              );
            }
            case "scatter":
              return (
                <ScatterChart
                  plot={plot}
                  environment={environment}
                  height={settings.chartHeight}
                />
              );
            case "relativeValues":
              return (
                <RelativeValuesGridChart
                  plot={plot}
                  environment={environment}
                />
              );
            default:
              // can happen if squiggle-lang version is too fresh and we messed up the components -> squiggle-lang dependency
              return `Unsupported plot ${plot satisfies never}`;
          }
        },
      };
    }
    case "Scale": {
      const scale: SqScale = value.value;
      return {
        children: () => <div>{scale.toString()}</div>,
      };
    }

    case "Dict": {
      const entries = getChildrenValues(value);
      return {
        heading: `Dict(${entries.length})`,
        preview: <SqTypeWithCount type="{}" count={entries.length} />,
        children: () =>
          entries.map((r, i) => <ValueViewer key={i} value={r} />),
      };
    }
    case "Array": {
      const entries = getChildrenValues(value);
      const length = entries.length;
      return {
        heading: `List(${length})`,
        preview: <SqTypeWithCount type="[]" count={length} />,
        children: () =>
          entries.map((r, i) => <ValueViewer key={i} value={r} />),
      };
    }

    case "Domain": {
      return {
        // TODO - same styles as `Boolean`?
        children: () => value.toString(),
      };
    }

    default: {
      return {
        heading: "Error",
        children: () => (
          <div>
            <span>No display for type: </span>{" "}
            <span className="font-semibold text-neutral-600">
              {(value as { tag: string }).tag}
            </span>
          </div>
        ),
      };
    }
  }
}
