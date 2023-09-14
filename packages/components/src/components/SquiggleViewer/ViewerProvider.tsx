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

import {
  SqValue,
  SqError,
  result,
  SqValuePath,
  SqCalculator,
} from "@quri/squiggle-lang";

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
import {
  CalculatorState,
  initialState,
  type FieldValue,
} from "../Calculator/calculatorReducer.js";

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
      type: "CALCULATOR_NEW";
      payload: {
        path: SqValuePath;
        calculator: SqCalculator;
      };
    }
  | {
      type: "CALCULATOR_SET_FIELD_CODE";
      payload: {
        path: SqValuePath;
        name: string;
        code: string;
      };
    }
  | {
      type: "CALCULATOR_SET_FIELD_VALUE";
      payload: {
        path: SqValuePath;
        name: string;
        value: result<SqValue, SqError> | null;
      };
    }
  | {
      type: "CALCULATOR_SET_FN_VALUE";
      payload: {
        path: SqValuePath;
        value: result<SqValue, SqError> | null;
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
  getSettings: () => ({ collapsed: false, calculator: null }),
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

export function useCalculatorFns() {
  const { dispatch } = useViewerContext();
  return {
    intitialize: (path: SqValuePath, calculator: SqCalculator) =>
      dispatch({ type: "CALCULATOR_NEW", payload: { path, calculator } }),
  };
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
  calculator: null,
};

const collapsedVariablesDefault: SettingsStore = {
  [topLevelBindingsName]: { collapsed: true, calculator: null },
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
      collapsed: ref?.collapsed ?? isCollapsed,
    };
  };

  const changeCalculator = (
    path: SqValuePath,
    fn: (calculator: CalculatorState) => CalculatorState
  ) => {
    const ref = settingsStoreRef.current[pathAsString(path)];
    if (ref && ref.calculator !== null) {
      settingsStoreRef.current[pathAsString(path)] = {
        ...ref,
        calculator: fn(ref.calculator),
      };
    }
  };

  const dispatch = useCallback(
    (action: Action) => {
      switch (action.type) {
        case "SET_SETTINGS":
          console.log(
            "SET SETTINGS",
            settingsStoreRef.current[pathAsString(action.payload.path)],
            action.payload.value
          );
          settingsStoreRef.current[pathAsString(action.payload.path)] =
            action.payload.value;
          return;
        case "FOCUS":
          setFocused(action.payload);
          return;
        case "UNFOCUS":
          setFocused(undefined);
          return;
        case "TOGGLE_COLLAPSED": {
          const ref = settingsStoreRef.current[pathAsString(action.payload)];
          ref.collapsed = !ref.collapsed;
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
        case "CALCULATOR_NEW": {
          const ref =
            settingsStoreRef.current[pathAsString(action.payload.path)];
          settingsStoreRef.current[pathAsString(action.payload.path)] = {
            ...ref,
            calculator: initialState(action.payload.calculator),
          };
          return;
        }
        case "CALCULATOR_SET_FIELD_CODE": {
          changeCalculator(action.payload.path, (state) => {
            const modifyField = (name: string, newField: FieldValue) => {
              const newFields = { ...state.fields, [name]: newField };
              return { ...state, fields: newFields };
            };
            const { name, code } = action.payload;
            const field = state.fields[name];
            const newValue = null;
            const newField = { ...field, code, value: newValue };
            return modifyField(name, newField);
          });
          return;
        }
        case "CALCULATOR_SET_FIELD_VALUE": {
          changeCalculator(action.payload.path, (state) => {
            const modifyField = (name: string, newField: FieldValue) => {
              const newFields = { ...state.fields, [name]: newField };
              return { ...state, fields: newFields };
            };
            const { name, value } = action.payload;
            const field = state.fields[name];
            const newField = { ...field, value };
            return modifyField(name, newField);
          });
          return;
        }
        case "CALCULATOR_SET_FN_VALUE": {
          changeCalculator(action.payload.path, (state) => {
            return { ...state, fn: { value: action.payload.value } };
          });
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
