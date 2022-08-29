import React, { useCallback, useRef } from "react";
import { environment, SqValueLocation } from "@quri/squiggle-lang";
import { DistributionPlottingSettings } from "../DistributionChart";
import { FunctionChartSettings } from "../FunctionChart";
import { ExpressionViewer } from "./ExpressionViewer";
import { ViewerContext } from "./ViewerContext";
import {
  LocalItemSettings,
  locationAsString,
  MergedItemSettings,
} from "./utils";
import { useSquiggle } from "../../lib/hooks";
import { SquiggleErrorAlert } from "../SquiggleErrorAlert";

type Props = {
  /** The output of squiggle's run */
  result: ReturnType<typeof useSquiggle>["result"];
  width?: number;
  height: number;
  distributionPlotSettings: DistributionPlottingSettings;
  /** Settings for displaying functions */
  chartSettings: FunctionChartSettings;
  /** Environment for further function executions */
  environment: environment;
  enableLocalSettings?: boolean;
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
  enableLocalSettings = false,
}) => {
  // can't store settings in the state because we don't want to rerender the entire tree on every change
  const settingsRef = useRef<Settings>({});

  const getSettings = useCallback(
    (location: SqValueLocation) => {
      return settingsRef.current[locationAsString(location)] || defaultSettings;
    },
    [settingsRef]
  );

  const setSettings = useCallback(
    (location: SqValueLocation, value: LocalItemSettings) => {
      settingsRef.current[locationAsString(location)] = value;
    },
    [settingsRef]
  );

  const getMergedSettings = useCallback(
    (location: SqValueLocation) => {
      const localSettings = getSettings(location);
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
        height: localSettings.height || height,
      };
      return result;
    },
    [distributionPlotSettings, chartSettings, environment, height, getSettings]
  );

  return (
    <ViewerContext.Provider
      value={{
        getSettings,
        setSettings,
        getMergedSettings,
        enableLocalSettings,
      }}
    >
      {result.tag === "Ok" ? (
        <ExpressionViewer value={result.value} width={width} />
      ) : (
        <SquiggleErrorAlert error={result.value} />
      )}
    </ViewerContext.Provider>
  );
};
