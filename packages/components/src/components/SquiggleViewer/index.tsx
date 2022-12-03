import React, { useCallback, useMemo, useRef } from "react";
import { SqValueLocation } from "@quri/squiggle-lang";
import { ExpressionViewer } from "./ExpressionViewer";
import { ViewerContext } from "./ViewerContext";
import {
  LocalItemSettings,
  locationAsString,
  MergedItemSettings,
} from "./utils";
import { useSquiggle } from "../../lib/hooks";
import { PartialViewSettings, viewSettingsSchema } from "../ViewSettingsForm";
import { SquiggleErrorAlert } from "../SquiggleErrorAlert";
import _ from "lodash";

export type SquiggleViewerProps = {
  /** The output of squiggle's run */
  result: ReturnType<typeof useSquiggle>["result"];
  enableLocalSettings?: boolean;
} & PartialViewSettings;

type SettingsStore = {
  [k: string]: LocalItemSettings;
};

const defaultSettings: LocalItemSettings = { collapsed: false };

export const SquiggleViewer: React.FC<SquiggleViewerProps> = ({
  result,
  enableLocalSettings = false,
  ...partialViewSettings
}) => {
  // can't store settings in the state because we don't want to rerender the entire tree on every change
  const settingsStoreRef = useRef<SettingsStore>({});

  const globalSettings = useMemo(() => {
    return _.merge({}, viewSettingsSchema.getDefault(), partialViewSettings);
  }, [partialViewSettings]);

  const getSettings = useCallback(
    (location: SqValueLocation) => {
      return (
        settingsStoreRef.current[locationAsString(location)] || defaultSettings
      );
    },
    [settingsStoreRef]
  );

  const setSettings = useCallback(
    (location: SqValueLocation, value: LocalItemSettings) => {
      settingsStoreRef.current[locationAsString(location)] = value;
    },
    [settingsStoreRef]
  );

  const getMergedSettings = useCallback(
    (location: SqValueLocation) => {
      const localSettings = getSettings(location);
      const result: MergedItemSettings = _.merge(
        {},
        globalSettings,
        localSettings
      );
      return result;
    },
    [globalSettings, getSettings]
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
      {result.ok ? (
        <ExpressionViewer value={result.value} />
      ) : (
        <SquiggleErrorAlert error={result.value} />
      )}
    </ViewerContext.Provider>
  );
};
