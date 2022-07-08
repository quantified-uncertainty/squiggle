import React, { useCallback, useRef } from "react";
import { environment } from "@quri/squiggle-lang";
import { DistributionPlottingSettings } from "../DistributionChart";
import { FunctionChartSettings } from "../FunctionChart";
import { ExpressionViewer } from "./ExpressionViewer";
import { ViewerContext } from "./ViewerContext";
import { Path, pathAsString } from "./utils";
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

type ItemSettings = {
  collapsed: boolean;
};

type Settings = {
  [k: string]: ItemSettings;
};

const defaultSettings: ItemSettings = { collapsed: false };

export const SquiggleViewer: React.FC<Props> = ({
  result,
  width,
  height,
  distributionPlotSettings,
  chartSettings,
  environment,
}) => {
  const settingsRef = useRef<Settings>({});

  const getSettings = useCallback(
    (path: Path) => {
      return settingsRef.current[pathAsString(path)] || defaultSettings;
    },
    [settingsRef]
  );

  const setSettings = useCallback(
    (path: Path, value: ItemSettings) => {
      settingsRef.current[pathAsString(path)] = value;
    },
    [settingsRef]
  );

  return (
    <ViewerContext.Provider
      value={{
        getSettings,
        setSettings,
      }}
    >
      {result.tag === "Ok" ? (
        <ExpressionViewer
          path={[]}
          expression={result.value}
          width={width}
          height={height}
          distributionPlotSettings={distributionPlotSettings}
          chartSettings={chartSettings}
          environment={environment}
        />
      ) : (
        <SquiggleErrorAlert error={result.value} />
      )}
    </ViewerContext.Provider>
  );
};
