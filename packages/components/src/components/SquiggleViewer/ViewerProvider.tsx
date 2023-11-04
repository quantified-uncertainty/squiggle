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
  LocalItemState,
  MergedItemSettings,
  getChildrenValues,
  pathAsString,
  topLevelBindingsName,
} from "./utils.js";
import { CodeEditorHandle } from "../CodeEditor.js";
import { CalculatorState } from "../Calculator/types.js";

export type Action =
  | {
      type: "SET_LOCAL_ITEM_STATE";
      payload: {
        path: SqValuePath;
        value: LocalItemState;
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
      type: "SET_COLLAPSED";
      payload: {
        path: SqValuePath;
        value: boolean;
      };
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
  // Note that we don't store localItemState themselves in the context (that would cause rerenders of the entire tree on each settings update).
  // Instead, we keep localItemState in local state and notify the global context via setLocalItemState to pass them down the component tree again if it got rebuilt from scratch.
  // See ./SquiggleViewer.tsx and ./ValueWithContextViewer.tsx for other implementation details on this.
  getLocalItemState({
    path,
    defaults,
  }: {
    path: SqValuePath;
    defaults?: LocalItemState;
  }): LocalItemState;
  getCalculator({ path }: { path: SqValuePath }): CalculatorState | undefined;
  getMergedSettings({
    path,
    defaults,
  }: {
    path: SqValuePath;
    defaults?: LocalItemState;
  }): MergedItemSettings;
  localSettingsEnabled: boolean; // show local settings icon in the UI
  focused?: SqValuePath;
  editor?: CodeEditorHandle;
  dispatch(action: Action): void;
};

export const ViewerContext = createContext<ViewerContextShape>({
  getLocalItemState: () => ({ collapsed: false, settings: {} }),
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

export function useSetLocalItemState() {
  const { dispatch } = useViewerContext();
  return (path: SqValuePath, value: LocalItemState) => {
    dispatch({
      type: "SET_LOCAL_ITEM_STATE",
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

export function useSetCollapsed() {
  const { dispatch } = useViewerContext();
  return (path: SqValuePath, isCollapsed: boolean) => {
    dispatch({
      type: "SET_COLLAPSED",
      payload: { path, value: isCollapsed },
    });
  };
}

export function useResetStateSettings() {
  const { dispatch } = useViewerContext();
  return (path: SqValuePath, value: LocalItemState) => {
    dispatch({
      type: "SET_LOCAL_ITEM_STATE",
      payload: {
        path,
        value: {
          ...value,
          settings: {},
        },
      },
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
  // stable callback identity here is important, see ValueWithContextViewer code
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

type LocalItemStateStore = {
  [k: string]: LocalItemState;
};

const defaultLocalItemState: LocalItemState = {
  collapsed: false,
  settings: {},
};

const collapsedVariablesDefault: LocalItemStateStore = {
  [topLevelBindingsName]: { collapsed: true, settings: {} },
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
  const localItemStateStoreRef = useRef<LocalItemStateStore>(
    beginWithVariablesCollapsed ? collapsedVariablesDefault : {}
  );

  const itemHandlesStoreRef = useRef<{ [k: string]: HTMLDivElement }>({});

  const [focused, setFocused] = useState<SqValuePath | undefined>();

  const globalSettings = useMemo(() => {
    return merge({}, defaultPlaygroundSettings, partialPlaygroundSettings);
  }, [partialPlaygroundSettings]);

  // I'm not sure if we should use this, or getLocalItemState(), which is similar.
  const getLocalItemStateRef = (
    path: SqValuePath
  ): LocalItemState | undefined => {
    return localItemStateStoreRef.current[pathAsString(path)];
  };

  const setLocalItemState = (
    path: SqValuePath,
    fn: (localItemState: LocalItemState) => LocalItemState
  ): void => {
    const newSettings = fn(getLocalItemStateRef(path) || defaultLocalItemState);
    localItemStateStoreRef.current[pathAsString(path)] = newSettings;
  };

  const getLocalItemState = useCallback(
    ({
      path,
      defaults = defaultLocalItemState,
    }: {
      path: SqValuePath;
      defaults?: LocalItemState;
    }) => {
      return localItemStateStoreRef.current[pathAsString(path)] || defaults;
    },
    [localItemStateStoreRef]
  );

  const getCalculator = useCallback(
    ({ path }: { path: SqValuePath }) => {
      const response = localItemStateStoreRef.current[pathAsString(path)];
      return response?.calculator;
    },
    [localItemStateStoreRef]
  );

  const getMergedSettings = useCallback(
    ({
      path,
      defaults = defaultLocalItemState,
    }: {
      path: SqValuePath;
      defaults?: LocalItemState;
    }) => {
      const localItemState = getLocalItemState({ path, defaults });
      const result: MergedItemSettings = merge(
        {},
        globalSettings,
        localItemState.settings
      );
      return result;
    },
    [globalSettings, getLocalItemState]
  );

  const setCollapsed = (path: SqValuePath, isCollapsed: boolean) => {
    setLocalItemState(path, (state) => ({
      ...state,
      collapsed: state?.collapsed ?? isCollapsed,
    }));
  };

  const dispatch = useCallback(
    (action: Action) => {
      switch (action.type) {
        case "SET_LOCAL_ITEM_STATE":
          setLocalItemState(action.payload.path, () => action.payload.value);
          return;
        case "FOCUS":
          setFocused(action.payload);
          return;
        case "UNFOCUS":
          setFocused(undefined);
          return;
        case "TOGGLE_COLLAPSED": {
          setLocalItemState(action.payload, (state) => ({
            ...state,
            collapsed: !state?.collapsed,
          }));
          return;
        }
        case "SET_COLLAPSED": {
          setLocalItemState(action.payload.path, (state) => ({
            ...state,
            collapsed: action.payload.value,
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
          setLocalItemState(path, (state) => ({
            ...state,
            calculator:
              state.calculator?.hashString === calculator.hashString
                ? {
                    // merge with existing value
                    ...state.calculator,
                    ...calculator,
                  }
                : calculator,
          }));
          return;
        }
      }
    },
    [localItemStateStoreRef]
  );

  return (
    <ViewerContext.Provider
      value={{
        getLocalItemState,
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
