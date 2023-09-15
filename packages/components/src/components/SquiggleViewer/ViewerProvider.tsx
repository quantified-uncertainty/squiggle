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
  topLevelBindingsName,
} from "./utils.js";
import { CodeEditorHandle } from "../CodeEditor.js";
import { CalculatorState } from "../Calculator/calculatorReducer.js";

export type Action =
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
      type: "TOGGLE_COLLAPSED";
      payload: SqValuePath;
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
    }
  | {
      type: "CALCULATOR_UPDATE";
      payload: {
        path: SqValuePath;
        calculator: CalculatorState;
      };
    };

export type ViewProviderDispatch = (action: Action) => void;

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
  getCalculator({ path }: { path: SqValuePath }): CalculatorState | undefined;
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
  getCalculator: () => undefined,
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

export function useToggleCollapsed() {
  const { dispatch } = useViewerContext();
  return (path: SqValuePath) => {
    dispatch({
      type: "TOGGLE_COLLAPSED",
      payload: path,
    });
  };
}

export function useFocus() {
  const { dispatch } = useViewerContext();
  return (path: SqValuePath) => {
    dispatch({
      type: "FOCUS",
      payload: path,
    });
  };
}

export function useUnfocus() {
  const { dispatch } = useViewerContext();
  return () => dispatch({ type: "UNFOCUS" });
}

export function useCollapseChildren() {
  const { dispatch } = useViewerContext();
  // stable callback identity here is important, see VariableBox code
  return useCallback(
    (value: SqValue) => {
      dispatch({
        type: "COLLAPSE_CHILDREN",
        payload: value,
      });
    },
    [dispatch]
  );
}

export function useIsFocused(location: SqValuePath) {
  const { focused } = useViewerContext();
  if (!focused) {
    return false;
  } else {
    return pathAsString(focused) === pathAsString(location);
  }
}

type SettingsStore = {
  [k: string]: LocalItemSettings;
};

const defaultLocalSettings: LocalItemSettings = {
  collapsed: false,
};

const collapsedVariablesDefault: SettingsStore = {
  [topLevelBindingsName]: { collapsed: true },
};

export const ViewerProvider: FC<
  PropsWithChildren<{
    partialPlaygroundSettings: PartialPlaygroundSettings;
    localSettingsEnabled: boolean;
    editor?: CodeEditorHandle;
    beginWithVariablesCollapsed?: boolean;
  }>
> = ({
  partialPlaygroundSettings,
  localSettingsEnabled,
  editor,
  beginWithVariablesCollapsed,
  children,
}) => {
  // can't store settings in the state because we don't want to rerender the entire tree on every change
  const settingsStoreRef = useRef<SettingsStore>(
    beginWithVariablesCollapsed ? collapsedVariablesDefault : {}
  );

  const itemHandlesStoreRef = useRef<{ [k: string]: HTMLDivElement }>({});

  const [focused, setFocused] = useState<SqValuePath | undefined>();

  const globalSettings = useMemo(() => {
    return merge({}, defaultPlaygroundSettings, partialPlaygroundSettings);
  }, [partialPlaygroundSettings]);

  // I'm not sure if we should use this, or getSettings(), which is similar.
  const getSettingsRef = (path: SqValuePath): LocalItemSettings | undefined => {
    return settingsStoreRef.current[pathAsString(path)];
  };

  const setSettings = (
    path: SqValuePath,
    fn: (settings: LocalItemSettings) => LocalItemSettings
  ): void => {
    const newSettings = fn(getSettingsRef(path) || defaultLocalSettings);
    settingsStoreRef.current[pathAsString(path)] = newSettings;
  };

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

  const getCalculator = useCallback(
    ({ path }: { path: SqValuePath }) => {
      const response = settingsStoreRef.current[pathAsString(path)];
      return response?.calculator;
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
    setSettings(path, (state) => ({
      ...state,
      collapsed: state?.collapsed ?? isCollapsed,
    }));
  };

  const dispatch = useCallback(
    (action: Action) => {
      switch (action.type) {
        case "SET_SETTINGS":
          setSettings(action.payload.path, () => action.payload.value);
          return;
        case "FOCUS":
          setFocused(action.payload);
          return;
        case "UNFOCUS":
          setFocused(undefined);
          return;
        case "TOGGLE_COLLAPSED": {
          setSettings(action.payload, (state) => ({
            ...state,
            collapsed: !state?.collapsed,
          }));
          return;
        }
        case "COLLAPSE_CHILDREN": {
          const children = getChildrenValues(action.payload);
          for (const child of children) {
            child.context && setCollapsed(child.context.path, true);
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
        case "CALCULATOR_UPDATE": {
          const { calculator, path } = action.payload;
          setSettings(path, (state) => ({
            ...state,
            calculator: calculator,
          }));
          return;
        }
      }
    },
    [settingsStoreRef]
  );

  return (
    <ViewerContext.Provider
      value={{
        getSettings,
        getCalculator,
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
