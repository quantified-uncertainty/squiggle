import React, { useCallback, useRef } from "react";
import { environment } from "@quri/squiggle-lang";
import { DistributionPlottingSettings } from "../DistributionChart";
import { FunctionChartSettings } from "../FunctionChart";
import { ExpressionViewer } from "./ExpressionViewer";
import { ViewerContext } from "./ViewerContext";
import {
  LocalItemSettings,
  MergedItemSettings,
  Path,
  pathAsString,
} from "./utils";
import { useSquiggle } from "../../lib/hooks";
import { SquiggleErrorAlert } from "../SquiggleErrorAlert";

type Props = {
  /** The output of squiggle's run */
  result: ReturnType<typeof useSquiggle>;
  width?: number;
  height: number;
  distributionPlotSettings: DistributionPlottingSettings;
  /** Settings for displaying functions */
  chartSettings: FunctionChartSettings;
  /** Environment for further function executions */
  environment: environment;
};

type Settings = {
  [k: string]: LocalItemSettings;
};

const defaultSettings: LocalItemSettings = { collapsed: false };

export const SquiggleViewer: React.FC<Props> = ({
  result,
  width,
  height,
  distributionPlotSettings,
  chartSettings,
  environment,
}) => {
  // can't store settings in the state because we don't want to rerender the entire tree on every change
  const settingsRef = useRef<Settings>({});

  const getSettings = useCallback(
    (path: Path) => {
      return settingsRef.current[pathAsString(path)] || defaultSettings;
    },
    [settingsRef]
  );

  const setSettings = useCallback(
    (path: Path, value: LocalItemSettings) => {
      settingsRef.current[pathAsString(path)] = value;
    },
    [settingsRef]
  );

  const getMergedSettings = useCallback(
    (path: Path) => {
      const localSettings = getSettings(path);
      const result: MergedItemSettings = {
        distributionPlotSettings: {
          ...distributionPlotSettings,
          ...(localSettings.distributionPlotSettings || {}),
        },
        chartSettings: {
          ...chartSettings,
          ...(localSettings.chartSettings || {}),
        },
        environment: {
          ...environment,
          ...(localSettings.environment || {}),
        },
      };
      return result;
    },
    [distributionPlotSettings, chartSettings, environment, getSettings]
  );

  return (
    <ViewerContext.Provider
      value={{
        getSettings,
        setSettings,
        getMergedSettings,
      }}
    >
      {result.tag === "Ok" ? (
        <ExpressionViewer
          path={[]}
          expression={result.value}
          width={width}
          height={height}
        />
      ) : (
        <SquiggleErrorAlert error={result.value} />
      )}
    </ViewerContext.Provider>
  );
};
