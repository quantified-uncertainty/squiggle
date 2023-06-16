import merge from "lodash/merge.js";
import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";

import {
  PartialPlaygroundSettings,
  defaultPlaygroundSettings,
} from "../PlaygroundSettings.js";
import { LocalItemSettings, MergedItemSettings } from "./utils.js";

import { SqValueLocation } from "@quri/squiggle-lang";

import { locationAsString } from "./utils.js";

type ViewerContextShape = {
  // Note that we don't store settings themselves in the context (that would cause rerenders of the entire tree on each settings update).
  // Instead, we keep settings in local state and notify the global context via setSettings to pass them down the component tree again if it got rebuilt from scratch.
  // See ./SquiggleViewer.tsx and ./VariableBox.tsx for other implementation details on this.
  getSettings(location: SqValueLocation): LocalItemSettings;
  getMergedSettings(location: SqValueLocation): MergedItemSettings;
  setSettings(location: SqValueLocation, value: LocalItemSettings): void;
  localSettingsEnabled: boolean; // show local settings icon in the UI
};

export const ViewerContext = createContext<ViewerContextShape>({
  getSettings: () => ({ collapsed: false }),
  getMergedSettings: () => defaultPlaygroundSettings,
  setSettings() {},
  localSettingsEnabled: false,
});

export function useViewerContext() {
  return useContext(ViewerContext);
}

export function useSetSettings() {
  const { setSettings } = useViewerContext();
  return setSettings;
}

type SettingsStore = {
  [k: string]: LocalItemSettings;
};

const defaultLocalSettings: LocalItemSettings = { collapsed: false };

export const ViewerProvider: FC<
  PropsWithChildren<{
    partialPlaygroundSettings: PartialPlaygroundSettings;
    localSettingsEnabled: boolean;
  }>
> = ({ partialPlaygroundSettings, localSettingsEnabled, children }) => {
  // can't store settings in the state because we don't want to rerender the entire tree on every change
  const settingsStoreRef = useRef<SettingsStore>({});

  const globalSettings = useMemo(() => {
    return merge({}, defaultPlaygroundSettings, partialPlaygroundSettings);
  }, [partialPlaygroundSettings]);

  const getSettings = useCallback(
    (location: SqValueLocation) => {
      return (
        settingsStoreRef.current[locationAsString(location)] ||
        defaultLocalSettings
      );
    },
    [settingsStoreRef]
  );

  const getMergedSettings = useCallback(
    (location: SqValueLocation) => {
      const localSettings = getSettings(location);
      const result: MergedItemSettings = merge(
        {},
        globalSettings,
        localSettings
      );
      return result;
    },
    [globalSettings, getSettings]
  );

  const setSettings = useCallback(
    (location: SqValueLocation, value: LocalItemSettings) => {
      settingsStoreRef.current[locationAsString(location)] = value;
    },
    [settingsStoreRef]
  );

  return (
    <ViewerContext.Provider
      value={{
        getSettings,
        getMergedSettings,
        localSettingsEnabled,
        setSettings,
      }}
    >
      {children}
    </ViewerContext.Provider>
  );
};
