import merge from "lodash/merge.js";
import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { SqValue, SqValuePath } from "@quri/squiggle-lang";

import {
  PartialPlaygroundSettings,
  defaultPlaygroundSettings,
} from "../PlaygroundSettings.js";
import {
  LocalItemSettings,
  MergedItemSettings,
  getChildrenValues,
  pathAsString,
} from "./utils.js";
import { CodeEditorHandle } from "../CodeEditor.js";

type Action =
  | {
      type: "SET_SETTINGS";
      payload: {
        path: SqValuePath;
        value: LocalItemSettings;
      };
    }
  | {
      type: "FOCUS";
      payload: SqValuePath;
    }
  | {
      type: "UNFOCUS";
    }
  | {
      type: "COLLAPSE_CHILDREN";
      payload: SqValue;
    }
  | {
      type: "SCROLL_TO_PATH";
      payload: {
        path: SqValuePath;
      };
    }
  | {
      type: "REGISTER_ITEM_HANDLE";
      payload: {
        path: SqValuePath;
        element: HTMLDivElement;
      };
    }
  | {
      type: "UNREGISTER_ITEM_HANDLE";
      payload: {
        path: SqValuePath;
      };
    };

type ViewerContextShape = {
  // Note that we don't store settings themselves in the context (that would cause rerenders of the entire tree on each settings update).
  // Instead, we keep settings in local state and notify the global context via setSettings to pass them down the component tree again if it got rebuilt from scratch.
  // See ./SquiggleViewer.tsx and ./VariableBox.tsx for other implementation details on this.
  getSettings({
    path,
    defaults,
  }: {
    path: SqValuePath;
    defaults?: LocalItemSettings;
  }): LocalItemSettings;
  getMergedSettings({
    path,
    defaults,
  }: {
    path: SqValuePath;
    defaults?: LocalItemSettings;
  }): MergedItemSettings;
  localSettingsEnabled: boolean; // show local settings icon in the UI
  focused?: SqValuePath;
  editor?: CodeEditorHandle;
  dispatch(action: Action): void;
};

export const ViewerContext = createContext<ViewerContextShape>({
  getSettings: () => ({ collapsed: false }),
  getMergedSettings: () => defaultPlaygroundSettings,
  localSettingsEnabled: false,
  focused: undefined,
  editor: undefined,
  dispatch() {},
});

export function useViewerContext() {
  return useContext(ViewerContext);
}

export function useSetSettings() {
  const { dispatch } = useViewerContext();
  return (path: SqValuePath, value: LocalItemSettings) => {
    dispatch({
      type: "SET_SETTINGS",
      payload: { path, value },
    });
  };
}

export function useFocus() {
  const { dispatch } = useViewerContext();
  return (location: SqValuePath) => {
    dispatch({
      type: "FOCUS",
      payload: location,
    });
  };
}

export function useUnfocus() {
  const { dispatch } = useViewerContext();
  return () => dispatch({ type: "UNFOCUS" });
}

export function useCollapseChildren() {
  const { dispatch } = useViewerContext();
  return (value: SqValue) => {
    dispatch({
      type: "COLLAPSE_CHILDREN",
      payload: value,
    });
  };
}

export function useIsFocused(location: SqValuePath | undefined) {
  const { focused } = useViewerContext();
  if (!focused || location === undefined) {
    return false;
  } else {
    return pathAsString(focused) === pathAsString(location);
  }
}

type SettingsStore = {
  [k: string]: LocalItemSettings;
};

const defaultLocalSettings: LocalItemSettings = { collapsed: false };

export const ViewerProvider: FC<
  PropsWithChildren<{
    partialPlaygroundSettings: PartialPlaygroundSettings;
    localSettingsEnabled: boolean;
    editor?: CodeEditorHandle;
  }>
> = ({ partialPlaygroundSettings, localSettingsEnabled, editor, children }) => {
  // can't store settings in the state because we don't want to rerender the entire tree on every change
  const settingsStoreRef = useRef<SettingsStore>({});

  const itemHandlesStoreRef = useRef<{ [k: string]: HTMLDivElement }>({});

  const [focused, setFocused] = useState<SqValuePath | undefined>();

  const globalSettings = useMemo(() => {
    return merge({}, defaultPlaygroundSettings, partialPlaygroundSettings);
  }, [partialPlaygroundSettings]);

  const getSettings = useCallback(
    ({
      path,
      defaults = defaultLocalSettings,
    }: {
      path: SqValuePath;
      defaults?: LocalItemSettings;
    }) => {
      return settingsStoreRef.current[pathAsString(path)] || defaults;
    },
    [settingsStoreRef]
  );

  const getMergedSettings = useCallback(
    ({
      path,
      defaults = defaultLocalSettings,
    }: {
      path: SqValuePath;
      defaults?: LocalItemSettings;
    }) => {
      const localSettings = getSettings({ path, defaults });
      const result: MergedItemSettings = merge(
        {},
        globalSettings,
        localSettings
      );
      return result;
    },
    [globalSettings, getSettings]
  );

  const setCollapsed = (path: SqValuePath, isCollapsed: boolean) => {
    const ref = settingsStoreRef.current[pathAsString(path)];
    settingsStoreRef.current[pathAsString(path)] = {
      ...ref,
      collapsed: isCollapsed,
    };
  };

  const dispatch = useCallback(
    (action: Action) => {
      switch (action.type) {
        case "SET_SETTINGS":
          settingsStoreRef.current[pathAsString(action.payload.path)] =
            action.payload.value;
          return;
        case "FOCUS":
          setFocused(action.payload);
          return;
        case "UNFOCUS":
          setFocused(undefined);
          return;
        case "COLLAPSE_CHILDREN": {
          const children = getChildrenValues(action.payload);
          for (const child of children) {
            child.path && setCollapsed(child.path, true);
          }
          return;
        }
        case "SCROLL_TO_PATH":
          itemHandlesStoreRef.current[
            pathAsString(action.payload.path)
          ]?.scrollIntoView({ behavior: "smooth" });
          return;
        case "REGISTER_ITEM_HANDLE":
          itemHandlesStoreRef.current[pathAsString(action.payload.path)] =
            action.payload.element;
          return;
        case "UNREGISTER_ITEM_HANDLE":
          delete itemHandlesStoreRef.current[pathAsString(action.payload.path)];
          return;
      }
    },
    [settingsStoreRef]
  );

  return (
    <ViewerContext.Provider
      value={{
        getSettings,
        getMergedSettings,
        localSettingsEnabled,
        editor,
        focused,
        dispatch,
      }}
    >
      {children}
    </ViewerContext.Provider>
  );
};
