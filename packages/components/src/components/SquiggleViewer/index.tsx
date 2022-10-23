import React, { useCallback, useRef } from "react";
import { SqValueLocation } from "@quri/squiggle-lang";
import { ExpressionViewer } from "./ExpressionViewer";
import { ViewerContext } from "./ViewerContext";
import {
  LocalItemSettings,
  locationAsString,
  MergedItemSettings,
} from "./utils";
import { useSquiggle } from "../../lib/hooks";
import {
  EditableViewSettings,
  viewSettingsSchema,
  viewSettingsToMerged,
} from "../ViewSettings";
import { SquiggleErrorAlert } from "../SquiggleErrorAlert";

// Flattened view settings, gets turned into props for SquiggleChart and SquiggleEditor
export type FlattenedViewSettings = Partial<
  EditableViewSettings & {
    width?: number;
    enableLocalSettings?: boolean;
  }
>;

type ViewSettings = {
  width?: number;
  enableLocalSettings?: boolean;
} & Omit<MergedItemSettings, "environment">;

export const createViewSettings = (
  props: FlattenedViewSettings
): ViewSettings => {
  const propsWithDefaults = { ...viewSettingsSchema.getDefault(), ...props };
  let merged = viewSettingsToMerged(propsWithDefaults);
  const { width, enableLocalSettings } = propsWithDefaults;

  return { ...merged, width, enableLocalSettings };
};

type Props = {
  /** The output of squiggle's run */
  result: ReturnType<typeof useSquiggle>["result"];
} & ViewSettings;

type Settings = {
  [k: string]: LocalItemSettings;
};

const defaultSettings: LocalItemSettings = { collapsed: false };

export const SquiggleViewer: React.FC<Props> = ({
  result,
  width,
  chartHeight,
  distributionChartSettings,
  functionChartSettings: chartSettings,
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
        distributionChartSettings: {
          ...distributionChartSettings,
          ...(localSettings.distributionChartSettings || {}),
        },
        functionChartSettings: {
          ...chartSettings,
          ...(localSettings.functionChartSettings || {}),
        },
        chartHeight: localSettings.chartHeight || chartHeight,
      };
      return result;
    },
    [distributionChartSettings, chartSettings, chartHeight, getSettings]
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
