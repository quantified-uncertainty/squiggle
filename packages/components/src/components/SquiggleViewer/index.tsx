import React, { useCallback, useRef } from "react";
import { environment } from "@quri/squiggle-lang";
import { PlotSettings } from "../DistributionChart";
import { FunctionSettings } from "../FunctionChart";
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
  plotSettings: PlotSettings;
  functionSettings: FunctionSettings;
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
  plotSettings,
  functionSettings,
  environment,
  enableLocalSettings = false,
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
        plotSettings: {
          ...plotSettings,
          ...(localSettings.plotSettings || {}),
        },
        functionSettings: {
          ...functionSettings,
          ...(localSettings.functionSettings || {}),
        },
        environment: {
          ...environment,
          ...(localSettings.environment || {}),
        },
        height: localSettings.height || height,
      };
      return result;
    },
    [plotSettings, functionSettings, environment, height, getSettings]
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
        <ExpressionViewer path={[]} expression={result.value} width={width} />
      ) : (
        <SquiggleErrorAlert error={result.value} />
      )}
    </ViewerContext.Provider>
  );
};
