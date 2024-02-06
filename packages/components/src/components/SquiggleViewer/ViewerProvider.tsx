import merge from "lodash/merge.js";
import {
  createContext,
  forwardRef,
  PropsWithChildren,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";

import { SqValue, SqValuePath } from "@quri/squiggle-lang";

import { SqOutput } from "../../../../squiggle-lang/src/public/types.js";
import { useStabilizeObjectIdentity } from "../../lib/hooks/useStabilizeObject.js";
import { SqValueWithContext, valueHasContext } from "../../lib/utility.js";
import { CalculatorState } from "../../widgets/CalculatorWidget/types.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import {
  defaultPlaygroundSettings,
  PartialPlaygroundSettings,
  PlaygroundSettings,
} from "../PlaygroundSettings.js";
import { SqListViewNode } from "./SqViewNode.js";
import {
  getChildrenValues,
  shouldBeginCollapsed,
  traverseCalculatorEdge,
} from "./utils.js";
import { ValueWithContextViewerHandle } from "./ValueWithContextViewer.js";

type ViewerType = "normal" | "tooltip";

function findNode(
  root: SqValue | undefined,
  path: SqValuePath,
  itemStore: ItemStore
) {
  if (!root || !path) {
    return;
  }
  return SqListViewNode.make(
    root,
    path,
    traverseCalculatorEdge(itemStore),
    (path) => itemStore.getState(path).collapsed
  );
}

export type SquiggleViewerHandle = {
  viewValuePath(path: SqValuePath): void;
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

type ValuePathUID = string;

/**
 * `ItemStore` is used for caching and for passing settings down the tree.
 * It allows us to avoid React tree rerenders on settings changes; instead, we can rerender individual item viewers on demand.
 * It also saves the state when the tree is rebuilt from scratch (for example, when the user changes the code in the editor).
 *
 * Note: this class is currently used as a primary source of truth. Should we use it as cache only, and store the state in React state instead?
 * Then we won't have to rely on `forceUpdate` for rerenders.
 */
export class ItemStore {
  state: Record<ValuePathUID, LocalItemState> = {};
  handles: Record<ValuePathUID, ValueWithContextViewerHandle> = {};

  setState(
    path: SqValuePath,
    fn: (localItemState: LocalItemState) => LocalItemState
  ): void {
    const newSettings = fn(this.state[path.uid()] || defaultLocalItemState);
    this.state[path.uid()] = newSettings;
  }

  getState(path: SqValuePath): LocalItemState {
    return this.state[path.uid()] || defaultLocalItemState;
  }

  getStateOrInitialize(value: SqValueWithContext): LocalItemState {
    const path = value.context.path;
    const pathString = path.uid();
    const existingState = this.state[path.uid()];
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
        const childPathString = child.context.path.uid();
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
    this.handles[path.uid()]?.forceUpdate();
  }

  registerItemHandle(path: SqValuePath, handle: ValueWithContextViewerHandle) {
    this.handles[path.uid()] = handle;
  }

  unregisterItemHandle(path: SqValuePath) {
    delete this.handles[path.uid()];
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

  scrollViewerToPath(path: SqValuePath) {
    this.handles[path.uid()]?.scrollIntoView();
  }

  focusOnPath(path: SqValuePath) {
    this.handles[path.uid()]?.focusOnHeader();
  }
}

type ViewerContextShape = {
  // Note that we don't store `localItemState` itself in the context (that would cause rerenders of the entire tree on each settings update).
  // Instead, we keep `localItemState` in local state and notify the global context via `setLocalItemState` to pass them down the component tree again if it got rebuilt from scratch.
  // See ./SquiggleViewer.tsx and ./ValueWithContextViewer.tsx for other implementation details on this.
  globalSettings: PlaygroundSettings;
  zoomedInPath: SqValuePath | undefined;
  setZoomedInPath: (value: SqValuePath | undefined) => void;
  editor?: CodeEditorHandle;
  itemStore: ItemStore;
  viewerType: ViewerType;
  initialized: boolean;
  handle: SquiggleViewerHandle;
  rootValue?: SqValueWithContext;
  sqOutput?: SqOutput;
  findNode: (path: SqValuePath) => SqListViewNode | undefined;
  sourceId: string;
};

export const ViewerContext = createContext<ViewerContextShape>({
  globalSettings: defaultPlaygroundSettings,
  zoomedInPath: undefined,
  setZoomedInPath: () => undefined,
  editor: undefined,
  itemStore: new ItemStore(),
  viewerType: "normal",
  handle: {
    viewValuePath: () => {},
  },
  initialized: false,
  rootValue: undefined,
  findNode: () => undefined,
  sqOutput: undefined,
  sourceId: "",
});

export function useViewerContext() {
  return useContext(ViewerContext);
}

// `<ValueWithContextViewer>` calls this hook to register its handle in `<ViewerProvider>`.
// This allows us to do two things later:
// 1. Implement `store.scrollViewerToPath`.
// 2. Re-render individual item viewers on demand, for example on "Collapse Children" menu action.
export function useRegisterAsItemViewer(
  path: SqValuePath,
  ref: ValueWithContextViewerHandle
) {
  const { itemStore } = useViewerContext();

  /**
   * Since `ViewerContext` doesn't store settings, this component won't rerender when `setSettings` is called.
   * So we use `forceUpdate` to force rerendering.
   * (This function is not used directly in this component. Instead, it's passed to `<ViewerProvider>` to be called when necessary, sometimes from other components.)
   */

  useEffect(() => {
    itemStore.registerItemHandle(path, ref);
    return () => itemStore.unregisterItemHandle(path);
  });
}

export function useSetLocalItemState() {
  const { itemStore } = useViewerContext();
  return (path: SqValuePath, value: LocalItemState) => {
    itemStore.setState(path, () => value);
    itemStore.forceUpdate(path);
  };
}

export function toggleCollapsed(itemStore: ItemStore, path: SqValuePath) {
  itemStore.setState(path, (state) => ({
    ...state,
    collapsed: !state?.collapsed,
  }));
  itemStore.forceUpdate(path);
}

export function useToggleCollapsed() {
  const { itemStore } = useViewerContext();
  return (path: SqValuePath) => {
    toggleCollapsed(itemStore, path);
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

export function useZoomIn() {
  const { zoomedInPath: zoomedInPath, setZoomedInPath: setZoomedInPath } =
    useViewerContext();
  return (path: SqValuePath) => {
    if (zoomedInPath?.isEqual(path)) {
      return; // nothing to do
    }
    if (path.isRoot()) {
      setZoomedInPath(undefined); // full screening on root nodes is not allowed
    } else {
      setZoomedInPath(path);
    }
  };
}

export function useZoomOut() {
  const { setZoomedInPath: setZoomedInPath } = useViewerContext();
  return () => setZoomedInPath(undefined);
}

export function useSqOutput() {
  const { sqOutput } = useViewerContext();
  return sqOutput;
}

export function useSourceId() {
  const { sourceId } = useViewerContext();
  return sourceId;
}

export function useScrollToEditorPath(path: SqValuePath) {
  const { editor, findNode } = useViewerContext();
  return () => {
    if (editor) {
      const value = findNode(path)?.value();
      const taggedLocation = value?.tags.location();
      const location = taggedLocation || value?.context?.findLocation();

      if (location) {
        editor?.scrollTo(location.start.offset, false);
      }
    }
  };
}

export function useIsZoomedIn(path: SqValuePath) {
  const { zoomedInPath: zoomedInPath } = useViewerContext();
  return zoomedInPath?.isEqual(path);
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

export function useViewerType() {
  const { viewerType } = useViewerContext();
  return viewerType;
}

type Props = PropsWithChildren<{
  partialPlaygroundSettings: PartialPlaygroundSettings;
  editor?: CodeEditorHandle;
  viewerType?: ViewerType;
  rootValue: SqValue | undefined;
  sqOutput: SqOutput | undefined;
  sourceId: string;
}>;

export const InnerViewerProvider = forwardRef<SquiggleViewerHandle, Props>(
  (
    {
      partialPlaygroundSettings: unstablePlaygroundSettings,
      editor,
      viewerType = "normal",
      rootValue,
      sqOutput,
      sourceId,
      children,
    },
    ref
  ) => {
    const [itemStore] = useState(() => new ItemStore());

    /**
     * Because we often obtain `partialPlaygroundSettings` with spread syntax, its identity changes on each render, which could
     * cause extra unnecessary re-renders of widgets, in some cases.
     * Related discussion: https://github.com/quantified-uncertainty/squiggle/pull/2525#discussion_r1393398447
     */
    const playgroundSettings = useStabilizeObjectIdentity(
      unstablePlaygroundSettings
    );

    const [zoomedInPath, setZoomedInPathPath] = useState<
      SqValuePath | undefined
    >();

    const globalSettings = useMemo(() => {
      return merge({}, defaultPlaygroundSettings, playgroundSettings);
    }, [playgroundSettings]);

    const handle: SquiggleViewerHandle = {
      viewValuePath(path: SqValuePath) {
        itemStore.scrollViewerToPath(path);
      },
    };

    useImperativeHandle(ref, () => handle);

    const _rootValue =
      rootValue && valueHasContext(rootValue) ? rootValue : undefined;

    return (
      <ViewerContext.Provider
        value={{
          rootValue: _rootValue,
          sqOutput,
          sourceId,
          globalSettings,
          editor,
          zoomedInPath,
          setZoomedInPath: setZoomedInPathPath,
          itemStore,
          viewerType,
          handle,
          initialized: true,
          findNode: (path) => findNode(_rootValue, path, itemStore),
        }}
      >
        {children}
      </ViewerContext.Provider>
    );
  }
);
InnerViewerProvider.displayName = "InnerViewerProvider";

const ProxyViewerProvider = forwardRef<SquiggleViewerHandle, Props>(
  (props, ref) => {
    const { handle } = useViewerContext();
    useImperativeHandle(ref, () => handle);
    return props.children; // TODO - props.settings will be ignored, what should we do?
  }
);
ProxyViewerProvider.displayName = "ProxyViewerProvider";

export const ViewerProvider = forwardRef<SquiggleViewerHandle, Props>(
  (props, ref) => {
    // `ViewerProvider` is a singleton, so if the context already exists, we don't initialize it again
    const { initialized } = useContext(ViewerContext);
    if (initialized) {
      return <ProxyViewerProvider ref={ref} {...props} />;
    } else {
      return <InnerViewerProvider ref={ref} {...props} />;
    }
  }
);
ViewerProvider.displayName = "ViewerProvider";
