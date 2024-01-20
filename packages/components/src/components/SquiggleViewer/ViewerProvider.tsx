import merge from "lodash/merge.js";
import {
  createContext,
  forwardRef,
  PropsWithChildren,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { SqValue, SqValuePath } from "@quri/squiggle-lang";

import { useForceUpdate } from "../../lib/hooks/useForceUpdate.js";
import { useStabilizeObjectIdentity } from "../../lib/hooks/useStabilizeObject.js";
import { SqValueWithContext, valueHasContext } from "../../lib/utility.js";
import { CalculatorState } from "../../widgets/CalculatorWidget/types.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import {
  defaultPlaygroundSettings,
  PartialPlaygroundSettings,
  PlaygroundSettings,
} from "../PlaygroundSettings.js";
import { getChildrenValues, shouldBeginCollapsed } from "./utils.js";

type ViewerType = "normal" | "tooltip";

export type SquiggleViewerHandle = {
  viewValuePath(path: SqValuePath): void;
};

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

type ValuePathUID = string;

class PathTreeNode {
  readonly tree: PathTree;
  readonly path: SqValuePath;
  readonly parent: PathTreeNode | undefined;
  children: PathTreeNode[] = [];

  constructor(
    path: SqValuePath,
    parent: PathTreeNode | undefined,
    tree: PathTree
  ) {
    this.parent = parent;
    this.tree = tree;
    this.path = path;
    this.isEqual = this.isEqual.bind(this);
  }

  uid() {
    return this.path.uid();
  }
  isRoot() {
    return this.path.isRoot();
  }

  private isEqual(other: PathTreeNode) {
    return this.path.isEqual(other.path);
  }

  private isCollapsed() {
    return this.tree.isPathCollapsed(this.path); // This seems awkward, should find another way to deal with it.
  }

  private childrenAreVisible() {
    return !this.isCollapsed();
  }

  lastChild(): PathTreeNode | undefined {
    return this.children[this.children.length - 1];
  }

  addChild(path: SqValuePath): PathTreeNode | undefined {
    //We don't really need this alreadyExists check, as this normally is just called by PathTree.addNode, which already checks for existence, but seems safe.
    const alreadyExists = this.children.some((child) =>
      child.path.isEqual(path)
    );
    if (!alreadyExists) {
      const node = new PathTreeNode(path, this, this.tree);
      this.children.push(node);
      return node;
    }
  }

  removeChild(node: PathTreeNode) {
    this.children = this.children.filter(
      (child) => !child.path.isEqual(node.path)
    );
  }

  siblings(): PathTreeNode[] {
    return this.parent?.children || [];
  }

  private getParentIndex() {
    //We could later optimize this by using the listIndex of arrayIndex nodes and the fact that dictKeys are sorted.
    const siblings = this.siblings();
    return siblings.findIndex(this.isEqual);
  }

  prevSibling() {
    const index = this.getParentIndex();
    const isRootOrError = index === -1;
    const isFirstSibling = index === 0;
    if (isRootOrError || isFirstSibling) {
      return undefined;
    }
    return this.siblings()[index - 1];
  }

  nextSibling() {
    const index = this.getParentIndex();
    const isRootOrError = index === -1;
    const isLastSibling = index === this.siblings().length - 1;
    if (isRootOrError || isLastSibling) {
      return undefined;
    }
    return this.siblings()[index + 1];
  }

  private lastVisibleSubChild(): PathTreeNode | undefined {
    if (this.children.length > 0 && this.childrenAreVisible()) {
      const lastChild = this.lastChild();
      return lastChild?.lastVisibleSubChild() || lastChild;
    } else {
      return this;
    }
  }

  private nextAvailableSibling(): PathTreeNode | undefined {
    return this.nextSibling() || this.parent?.nextAvailableSibling();
  }

  next(): PathTreeNode | undefined {
    return this.children.length > 0 && !this.isCollapsed()
      ? this.children[0]
      : this.nextAvailableSibling();
  }

  prev(): PathTreeNode | undefined {
    const prevSibling = this.prevSibling();
    if (!prevSibling) {
      return this.parent;
    }
    return prevSibling.lastVisibleSubChild();
  }
}

class PathTree {
  readonly root: PathTreeNode;
  readonly nodes: Map<ValuePathUID, PathTreeNode> = new Map();
  readonly values: Map<ValuePathUID, SqValueWithContext> = new Map(); // This could probably go to a better place
  readonly isPathCollapsed: (path: SqValuePath) => boolean;

  constructor(
    rootNode: SqValueWithContext,
    getIsCollapsed: (path: SqValuePath) => boolean
  ) {
    this.root = new PathTreeNode(rootNode.context.path, undefined, this);
    this._addNode(this.root, rootNode);
    this.isPathCollapsed = getIsCollapsed;
  }

  private _addNode(node: PathTreeNode, value: SqValueWithContext) {
    this.nodes.set(node.uid(), node);
    this.values.set(node.uid(), value);
  }

  private _removeNode(node: PathTreeNode) {
    this.nodes.delete(node.uid());
    this.values.delete(node.uid());
    node.parent?.removeChild(node);
    node.children.forEach((child) => this._removeNode(child));
  }

  getNode(path: SqValuePath): PathTreeNode | undefined {
    return this.nodes.get(path.uid());
  }

  getValue(path: SqValuePath): SqValueWithContext | undefined {
    return this.values.get(path.uid());
  }

  removeNode(value: SqValueWithContext): void {
    const node = this.getNode(value.context.path);
    if (node) {
      this._removeNode(node);
    }
  }

  addNode(child: SqValueWithContext, parent: SqValueWithContext) {
    if (!this.getNode(child.context.path)) {
      const parentNode = this.getNode(parent.context.path);
      if (parentNode) {
        const newNode = parentNode.addChild(child.context.path);
        newNode && this._addNode(newNode, child);
      }
    }
  }
}

function isElementInView(element: HTMLElement) {
  const elementRect = element.getBoundingClientRect();
  const container = document.querySelector(
    '[data-testid="dynamic-viewer-result"]'
  );
  if (!container) {
    return false;
  }

  const containerRect = container.getBoundingClientRect();

  return (
    elementRect.top >= containerRect.top &&
    elementRect.top + 20 <= containerRect.bottom
  );
}
/**
 * `ItemStore` is used for caching and for passing settings down the tree.
 * It allows us to avoid React tree rerenders on settings changes; instead, we can rerender individual item viewers on demand.
 * It also saves the state when the tree is rebuilt from scratch (for example, when the user changes the code in the editor).
 *
 * Note: this class is currently used as a primary source of truth. Should we use it as cache only, and store the state in React state instead?
 * Then we won't have to rely on `forceUpdate` for rerenders.
 */
class ItemStore {
  state: Record<ValuePathUID, LocalItemState> = {};
  handles: Record<ValuePathUID, ItemHandle> = {};

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

  registerItemHandle(path: SqValuePath, handle: ItemHandle) {
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
    // setFocused(path);
    this.handles[path.uid()]?.element.scrollIntoView({
      behavior: "instant",
    });
  }

  isInView(path: SqValuePath) {
    return isElementInView(this.handles[path.uid()]?.element);
  }
}

type ArrowEvent =
  | "ArrowDown"
  | "ArrowUp"
  | "ArrowLeft"
  | "ArrowRight"
  | "Enter";

export function isArrowEvent(str: string): str is ArrowEvent {
  return ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Enter"].includes(
    str
  );
}

type ViewerContextShape = {
  // Note that we don't store `localItemState` itself in the context (that would cause rerenders of the entire tree on each settings update).
  // Instead, we keep `localItemState` in local state and notify the global context via `setLocalItemState` to pass them down the component tree again if it got rebuilt from scratch.
  // See ./SquiggleViewer.tsx and ./ValueWithContextViewer.tsx for other implementation details on this.
  globalSettings: PlaygroundSettings;
  pathTree: PathTree | undefined;
  setPathTree: (value: PathTree | undefined) => void;
  focused: SqValuePath | undefined;
  setFocused: (value: SqValuePath | undefined) => void;
  editor?: CodeEditorHandle;
  itemStore: ItemStore;
  viewerType: ViewerType;
  initialized: boolean;
  handle: SquiggleViewerHandle;
};

export const ViewerContext = createContext<ViewerContextShape>({
  globalSettings: defaultPlaygroundSettings,
  pathTree: undefined,
  setPathTree: () => undefined,
  focused: undefined,
  setFocused: () => undefined,
  editor: undefined,
  itemStore: new ItemStore(),
  viewerType: "normal",
  handle: {
    viewValuePath: () => {},
  },
  initialized: false,
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
  value: SqValueWithContext,
  parent: SqValue | undefined
) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { itemStore, pathTree, setPathTree } = useViewerContext();

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

    if (!pathTree) {
      if (!parent) {
        const newPathTree = new PathTree(
          value,
          (path) => itemStore.getState(path).collapsed
        );
        setPathTree(newPathTree);
      }
    } else if (parent) {
      if (valueHasContext(parent)) {
        pathTree.addNode(value, parent);
      }
    }

    return () => {
      itemStore.unregisterItemHandle(path); // TODO: Seems to happen way too often
      // pathTree?.removeNode(value);
    };
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
  const { focused, setFocused } = useViewerContext();
  return (path: SqValuePath) => {
    if (focused?.isEqual(path)) {
      return; // nothing to do
    }
    if (path.isRoot()) {
      setFocused(undefined); // focusing on root nodes is not allowed
    } else {
      setFocused(path);
    }
  };
}

export function useUnfocus() {
  const { setFocused } = useViewerContext();
  return () => setFocused(undefined);
}

function scrollEditorToPath(
  path: SqValuePath,
  pathTree: PathTree,
  editor?: CodeEditorHandle
) {
  const value = pathTree.getValue(path);
  const location = value?.context?.findLocation();

  if (location) {
    editor?.scrollTo(location.start.offset);
  }
}

const focusHeader = (path: SqValuePath, itemStore: ItemStore) => {
  const header = itemStore.handles[path.uid()]?.element.querySelector("header");
  if (header) {
    header.focus();
  }
};

const scrollViewerToPath = (path: SqValuePath, itemStore: ItemStore) => {
  if (!itemStore.isInView(path)) {
    itemStore.scrollViewerToPath(path);
  }
};

export function useItemEvent(selected: SqValuePath) {
  const { setFocused, itemStore, editor, pathTree } = useViewerContext();
  const getNode = (path: SqValuePath) => pathTree?.getNode(path);

  return (event: string) => {
    if (isArrowEvent(event) && pathTree) {
      const node = getNode(selected);
      switch (event) {
        case "ArrowDown": {
          const newItem = node?.next();
          if (newItem) {
            const newPath = newItem.path;
            focusHeader(newPath, itemStore);
            scrollViewerToPath(newPath, itemStore);
            scrollEditorToPath(newPath, pathTree, editor);
          }
          break;
        }
        case "ArrowUp": {
          const newItem = node?.prev();
          if (newItem) {
            const newPath = newItem.path;
            focusHeader(newPath, itemStore);
            scrollViewerToPath(newPath, itemStore);
            scrollEditorToPath(newPath, pathTree, editor);
          }
          break;
        }
        case "ArrowLeft": {
          const newItem = node?.parent;
          newItem && !newItem.isRoot() && focusHeader(newItem.path, itemStore);
          break;
        }
        case "ArrowRight": {
          itemStore.setState(selected, (state) => ({
            ...state,
            collapsed: !state?.collapsed,
          }));
          itemStore.forceUpdate(selected);
          scrollViewerToPath(selected, itemStore);
          break;
        }
        case "Enter": {
          setFocused(selected);
          setTimeout(() => {
            focusHeader(selected, itemStore);
          }, 1);
          break;
        }
      }
    }
  };
}
export function useFocusedItemEvent(selected: SqValuePath) {
  const { setFocused, itemStore, editor, pathTree } = useViewerContext();
  const getNode = (path: SqValuePath) => pathTree?.getNode(path);

  return (event: string) => {
    if (isArrowEvent(event) && pathTree) {
      const node = getNode(selected);
      switch (event) {
        case "ArrowDown": {
          const newItem = node?.children[0];
          if (newItem) {
            focusHeader(newItem.path, itemStore);
          }
          break;
        }
        case "ArrowUp": {
          const newItem = node?.parent;
          if (newItem) {
            if (newItem.isRoot()) {
              setFocused(undefined);
              setTimeout(() => {
                focusHeader(selected, itemStore);
              }, 1);
            } else {
              const newPath = newItem.path;
              setFocused(newPath);
              setTimeout(() => {
                focusHeader(newPath, itemStore);
                scrollEditorToPath(newPath, pathTree, editor);
              }, 1);
            }
          }
          break;
        }
        case "ArrowLeft": {
          const newPath = node?.prevSibling()?.path;
          if (newPath) {
            setFocused(newPath);
            focusHeader(newPath, itemStore);
            scrollEditorToPath(newPath, pathTree, editor);
          }
          break;
        }
        case "ArrowRight": {
          const newPath = node?.nextSibling()?.path;
          if (newPath) {
            setFocused(newPath);
            focusHeader(newPath, itemStore);
            scrollEditorToPath(newPath, pathTree, editor);
          }
          break;
        }
        case "Enter": {
          setFocused(undefined);
          setTimeout(() => {
            focusHeader(selected, itemStore);
          }, 1);
          break;
        }
      }
    }
  };
}

export function useIsFocused(path: SqValuePath) {
  const { focused } = useViewerContext();
  return focused?.isEqual(path);
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
}>;

export const InnerViewerProvider = forwardRef<SquiggleViewerHandle, Props>(
  (
    {
      partialPlaygroundSettings: unstablePlaygroundSettings,
      editor,
      viewerType = "normal",
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

    const [focused, setFocused] = useState<SqValuePath | undefined>();
    const [pathTree, setPathTree] = useState<PathTree | undefined>();

    const globalSettings = useMemo(() => {
      return merge({}, defaultPlaygroundSettings, playgroundSettings);
    }, [playgroundSettings]);

    const handle: SquiggleViewerHandle = {
      viewValuePath(path: SqValuePath) {
        itemStore.scrollViewerToPath(path);
      },
    };

    useImperativeHandle(ref, () => handle);

    return (
      <ViewerContext.Provider
        value={{
          globalSettings,
          editor,
          focused,
          setFocused,
          pathTree,
          setPathTree,
          itemStore,
          viewerType,
          handle,
          initialized: true,
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
