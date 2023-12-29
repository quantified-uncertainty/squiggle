import merge from "lodash/merge.js";
import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { SqValuePath } from "@quri/squiggle-lang";

import { useForceUpdate } from "../../lib/hooks/useForceUpdate.js";
import { SqValueWithContext } from "../../lib/utility.js";
import { CalculatorState } from "../../widgets/CalculatorWidget/types.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import {
  defaultPlaygroundSettings,
  PartialPlaygroundSettings,
  PlaygroundSettings,
} from "../PlaygroundSettings.js";
import {
  getChildrenValues,
  pathAsString,
  shouldBeginCollapsed,
  topLevelBindingsName,
} from "./utils.js";

type ItemHandle = {
  element: HTMLDivElement;
  forceUpdate: () => void;
};

type LocalItemState = Readonly<{
  collapsed: boolean;
  calculator?: CalculatorState;
  settings: Pick<
    PartialPlaygroundSettings,
    "distributionChartSettings" | "functionChartSettings"
  >;
}>;

const defaultLocalItemState: LocalItemState = {
  collapsed: false,
  settings: {},
};

/**
 * `ItemStore` is used for caching and for passing settings down the tree.
 * It allows us to avoid React tree rerenders on settings changes; instead, we can rerender individual item viewers on demand.
 * It also saves the state when the tree is rebuilt from scratch (for example, when the user changes the code in the editor).
 *
 * Note: this class is currently used as a primary source of truth. Should we use it as cache only, and store the state in React state instead?
 * Then we won't have to rely on `forceUpdate` for rerenders.
 */
class ItemStore {
  state: Record<string, LocalItemState> = {};
  handles: Record<string, ItemHandle> = {};

  constructor({
    beginWithVariablesCollapsed,
  }: {
    beginWithVariablesCollapsed?: boolean;
  }) {
    if (beginWithVariablesCollapsed) {
      this.state = {
        [topLevelBindingsName]: { collapsed: true, settings: {} },
      };
    }
  }

  setState(
    path: SqValuePath,
    fn: (localItemState: LocalItemState) => LocalItemState
  ): void {
    const pathString = pathAsString(path);
    const newSettings = fn(this.state[pathString] || defaultLocalItemState);
    this.state[pathString] = newSettings;
  }

  getState(path: SqValuePath): LocalItemState {
    return this.state[pathAsString(path)] || defaultLocalItemState;
  }

  getStateOrInitialize(value: SqValueWithContext): LocalItemState {
    const path = value.context.path;
    const pathString = pathAsString(path);
    const existingState = this.state[pathString];
    if (existingState) {
      return existingState;
    }

    this.state[pathString] = defaultLocalItemState;

    const childrenValues = getChildrenValues(value);

    const collapseChildren = () => {
      for (const child of childrenValues) {
        if (!child.context) {
          continue; // shouldn't happen
        }
        const childPathString = pathAsString(child.context.path);
        if (this.state[childPathString]) {
          continue; // shouldn't happen, if parent state is not initialized, child state won't be initialized either
        }
        this.state[childPathString] = {
          ...defaultLocalItemState,
          collapsed: true,
        };
      }
    };

    if (childrenValues.length > 10) {
      collapseChildren();
    }

    if (shouldBeginCollapsed(value, path)) {
      this.state[pathString] = {
        ...this.state[pathString],
        collapsed: true,
      };
    }

    return this.state[pathString];
  }

  getCalculator(path: SqValuePath): CalculatorState | undefined {
    return this.getState(path).calculator;
  }

  forceUpdate(path: SqValuePath) {
    this.handles[pathAsString(path)]?.forceUpdate();
  }

  registerItemHandle(path: SqValuePath, handle: ItemHandle) {
    this.handles[pathAsString(path)] = handle;
  }

  unregisterItemHandle(path: SqValuePath) {
    delete this.handles[pathAsString(path)];
  }

  updateCalculatorState(path: SqValuePath, calculator: CalculatorState) {
    this.setState(path, (state) => ({
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
  }

  scrollToPath(path: SqValuePath) {
    this.handles[pathAsString(path)]?.element.scrollIntoView({
      behavior: "smooth",
    });
  }
}

type ViewerContextShape = {
  // Note that we don't store localItemState themselves in the context (that would cause rerenders of the entire tree on each settings update).
  // Instead, we keep localItemState in local state and notify the global context via setLocalItemState to pass them down the component tree again if it got rebuilt from scratch.
  // See ./SquiggleViewer.tsx and ./ValueWithContextViewer.tsx for other implementation details on this.
  globalSettings: PlaygroundSettings;
  focused: SqValuePath | undefined;
  setFocused: (value: SqValuePath | undefined) => void;
  editor?: CodeEditorHandle;
  itemStore: ItemStore;
};

export const ViewerContext = createContext<ViewerContextShape>({
  globalSettings: defaultPlaygroundSettings,
  focused: undefined,
  setFocused: () => undefined,
  editor: undefined,
  itemStore: new ItemStore({}),
});

export function useViewerContext() {
  return useContext(ViewerContext);
}

// `<ValueWithContextViewer>` calls this hook to register its handle in `<ViewerProvider>`.
// This allows us to do two things later:
// 1. Implement `store.scrollToPath`.
// 2. Re-render individual item viewers on demand, for example on "Collapse Children" menu action.
export function useRegisterAsItemViewer(path: SqValuePath) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { itemStore } = useViewerContext();

  /**
   * Since `ViewerContext` doesn't store settings, this component won't rerender when `setSettings` is called.
   * So we use `forceUpdate` to force rerendering.
   * (This function is not used directly in this component. Instead, it's passed to `<ViewerProvider>` to be called when necessary, sometimes from other components.)
   */
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    itemStore.registerItemHandle(path, { element, forceUpdate });
    return () => itemStore.unregisterItemHandle(path);
  });

  return ref;
}

export function useSetLocalItemState() {
  const { itemStore } = useViewerContext();
  return (path: SqValuePath, value: LocalItemState) => {
    itemStore.setState(path, () => value);
    itemStore.forceUpdate(path);
  };
}

export function useToggleCollapsed() {
  const { itemStore } = useViewerContext();
  return (path: SqValuePath) => {
    itemStore.setState(path, (state) => ({
      ...state,
      collapsed: !state?.collapsed,
    }));
    itemStore.forceUpdate(path);
  };
}

export function useSetCollapsed() {
  const { itemStore } = useViewerContext();
  return (
    path: SqValuePath,
    isCollapsed: boolean,
    options?: { skipUpdate: boolean }
  ) => {
    itemStore.setState(path, (state) => ({
      ...state,
      collapsed: isCollapsed,
    }));
    options?.skipUpdate || itemStore.forceUpdate(path);
  };
}

export function useResetStateSettings() {
  const { itemStore } = useViewerContext();
  return (path: SqValuePath) => {
    itemStore.setState(path, (state) => ({
      ...state,
      settings: {},
    }));
    itemStore.forceUpdate(path);
  };
}

export function useHasLocalSettings(path: SqValuePath) {
  const { itemStore } = useViewerContext();
  const localState = itemStore.getState(path);
  return Boolean(
    localState.settings.distributionChartSettings ||
      localState.settings.functionChartSettings
  );
}

export function useFocus() {
  const { setFocused } = useViewerContext();
  return (value: SqValuePath) => setFocused(value);
}

export function useUnfocus() {
  const { setFocused } = useViewerContext();
  return () => setFocused(undefined);
}

export function useIsFocused(path: SqValuePath) {
  const { focused } = useViewerContext();
  return focused && pathAsString(focused) === pathAsString(path);
}

export function useMergedSettings(path: SqValuePath) {
  const { itemStore, globalSettings } = useViewerContext();

  const localItemState = itemStore.getState(path);

  const result: PlaygroundSettings = useMemo(
    () => merge({}, globalSettings, localItemState.settings),
    [globalSettings, localItemState.settings]
  );
  return result;
}

export const ViewerProvider: FC<
  PropsWithChildren<{
    partialPlaygroundSettings: PartialPlaygroundSettings;
    editor?: CodeEditorHandle;
    beginWithVariablesCollapsed?: boolean;
    rootPathOverride?: SqValuePath;
  }>
> = ({
  partialPlaygroundSettings,
  editor,
  beginWithVariablesCollapsed,
  rootPathOverride,
  children,
}) => {
  const [itemStore] = useState(
    () => new ItemStore({ beginWithVariablesCollapsed })
  );

  const [focused, setFocused] = useState<SqValuePath | undefined>(
    rootPathOverride
  );

  const globalSettings = useMemo(() => {
    return merge({}, defaultPlaygroundSettings, partialPlaygroundSettings);
  }, [partialPlaygroundSettings]);

  return (
    <ViewerContext.Provider
      value={{
        globalSettings,
        editor,
        focused,
        setFocused,
        itemStore,
      }}
    >
      {children}
    </ViewerContext.Provider>
  );
};
