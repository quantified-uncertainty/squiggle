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
import {
  getChildrenValues,
  pathAsString,
  shouldBeginCollapsed,
} from "./utils.js";

export type SquiggleViewerHandle = {
  viewValuePath(path: SqValuePath): void;
  onKeyPress(stroke: string): void;
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

class PathTreeNode {
  value: SqValueWithContext;
  tree: PathTree;
  path: string;
  fullPath: SqValuePath;
  parent: PathTreeNode | undefined;
  children: PathTreeNode[] = [];

  constructor(
    value: SqValueWithContext,
    parent: PathTreeNode | undefined,
    tree: PathTree
  ) {
    this.value = value;
    this.parent = parent;
    this.tree = tree;
    this.path = pathAsString(value.context.path);
    this.fullPath = value.context.path;
    this.isEqual = this.isEqual.bind(this);
  }

  isEqual(other: PathTreeNode) {
    return this.path === other.path;
  }

  isRoot() {
    return this.isEqual(this.tree.root);
  }

  isCollapsed() {
    return this.tree.itemStore.getState(this.value.context.path).collapsed;
  }

  addChild(value: SqValueWithContext): PathTreeNode {
    const node = new PathTreeNode(value, this, this.tree);
    this.children.push(node);
    return node;
  }

  removeChild(node: PathTreeNode) {
    this.children = this.children.filter((child) => child.path !== node.path);
  }

  pathName() {
    return pathAsString(this.value.context.path);
  }

  siblings(): PathTreeNode[] {
    return this.parent?.children || [];
  }

  getParentIndex() {
    const siblings = this.siblings();
    return siblings.findIndex(this.isEqual);
  }

  prevSibling() {
    const index = this.getParentIndex();
    if (index === -1) {
      return undefined;
    } else if (index === 0) {
      return undefined;
    }
    return this.siblings()[index - 1];
  }

  nextSibling() {
    const index = this.getParentIndex();
    if (index === -1) {
      return undefined;
    } else if (index === this.siblings().length - 1) {
      return undefined;
    }
    return this.siblings()[index + 1];
  }

  hasVisibleChildren() {
    return this.children.length > 0 && !this.isCollapsed();
  }

  findLastVisibleChild(): PathTreeNode | undefined {
    if (this.hasVisibleChildren()) {
      const lastChild = this.children[this.children.length - 1];
      return lastChild.findLastVisibleChild() || lastChild;
    } else {
      return this;
    }
  }

  nextAvailableSibling(): PathTreeNode | undefined {
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
    return prevSibling.findLastVisibleChild();
  }

  toJS() {
    return {
      value: this.value,
      children: this.children.map((child) => child.toJS()),
    };
  }
}

class PathTree {
  root: PathTreeNode;
  nodes: Map<string, PathTreeNode> = new Map();
  itemStore: ItemStore;

  constructor(rootNote: SqValueWithContext, itemStore) {
    this.root = new PathTreeNode(rootNote, undefined, this);
    this._addNode(this.root);
    this.itemStore = itemStore;
  }

  _addNode(value: PathTreeNode) {
    const pathName = value.pathName();
    this.nodes.set(pathName, value);
  }

  _removeNode(value: PathTreeNode) {
    this.nodes.delete(value.pathName());
    value.children.forEach((child) => this._removeNode(child));
  }

  removeNode(value: SqValueWithContext): void {
    const node = this.nodes.get(pathAsString(value.context.path));
    if (node) {
      node.parent?.removeChild(node);
      this.recursivelyRemoveNode(node);
    }
  }

  recursivelyRemoveNode(node: PathTreeNode): void {
    this.nodes.delete(node.pathName());
    node.children.forEach((child) => this.recursivelyRemoveNode(child));
  }

  toJS() {
    return this.root.toJS();
  }

  addFromSqValue(child: SqValueWithContext, parent: SqValueWithContext) {
    const path = pathAsString(child.context.path);
    if (!this.nodes.has(path)) {
      const parentNode = this.nodes.get(pathAsString(parent.context.path));
      if (parentNode) {
        this._addNode(parentNode.addChild(child));
      }
    }
  }

  findFromPathName(pathName: string): PathTreeNode | undefined {
    return this.nodes.get(pathName);
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
  state: Record<string, LocalItemState> = {};
  handles: Record<string, ItemHandle> = {};

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
    // setFocused(path);
    this.handles[pathAsString(path)]?.element.scrollIntoView({
      behavior: "instant",
    });
  }

  isInView(path: SqValuePath) {
    return isElementInView(this.handles[pathAsString(path)]?.element);
  }
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
  selected: SqValuePath | undefined;
  setSelected: (value: SqValuePath | undefined) => void;
  editor?: CodeEditorHandle;
  itemStore: ItemStore;
  initialized: boolean;
  handle: SquiggleViewerHandle;
};

export const ViewerContext = createContext<ViewerContextShape>({
  globalSettings: defaultPlaygroundSettings,
  pathTree: undefined,
  setPathTree: () => undefined,
  focused: undefined,
  setFocused: () => undefined,
  selected: undefined,
  setSelected: () => undefined,
  editor: undefined,
  itemStore: new ItemStore(),
  handle: {
    viewValuePath: () => {},
    onKeyPress: () => {},
  },
  initialized: false,
});

export function useViewerContext() {
  return useContext(ViewerContext);
}

// `<ValueWithContextViewer>` calls this hook to register its handle in `<ViewerProvider>`.
// This allows us to do two things later:
// 1. Implement `store.scrollToPath`.
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
        const newPathTree = new PathTree(value, itemStore);
        setPathTree(newPathTree);
      }
    } else if (parent) {
      if (valueHasContext(parent)) {
        pathTree.addFromSqValue(value, parent);
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
    if (focused && pathAsString(focused) === pathAsString(path)) {
      return; // nothing to do
    }
    if (path.isRoot()) {
      setFocused(undefined); // focusing on root nodes is not allowed
    } else {
      setFocused(path);
    }
  };
}

export function useSelect() {
  const { selected, setSelected } = useViewerContext();
  return (path: SqValuePath) => {
    if (selected && pathAsString(selected) === pathAsString(path)) {
      return; // nothing to do
    }
    if (path.isRoot()) {
      setSelected(undefined); // selecting root nodes is not allowed
    } else {
      setSelected(path);
    }
  };
}

export function useUnfocus() {
  const { setFocused } = useViewerContext();
  return () => setFocused(undefined);
}

export function useIsFocused(path: SqValuePath) {
  const { focused } = useViewerContext();
  return focused && pathAsString(focused) === pathAsString(path);
}

export function useIsSelected(path: SqValuePath) {
  const { selected } = useViewerContext();
  return selected && pathAsString(selected) === pathAsString(path);
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

type Props = PropsWithChildren<{
  partialPlaygroundSettings: PartialPlaygroundSettings;
  editor?: CodeEditorHandle;
}>;

type ArrowEvent =
  | "ArrowDown"
  | "ArrowUp"
  | "ArrowLeft"
  | "ArrowRight"
  | "Enter";

function isArrowEvent(str: string): str is ArrowEvent {
  return ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Enter"].includes(
    str
  );
}

export const InnerViewerProvider = forwardRef<SquiggleViewerHandle, Props>(
  (
    { partialPlaygroundSettings: unstablePlaygroundSettings, editor, children },
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
    const [selected, setSelected] = useState<SqValuePath | undefined>();
    const [pathTree, setPathTree] = useState<PathTree | undefined>();

    const globalSettings = useMemo(() => {
      return merge({}, defaultPlaygroundSettings, playgroundSettings);
    }, [playgroundSettings]);

    function scrollToPath(path: SqValuePath) {
      const location = pathTree?.nodes
        .get(pathAsString(path))
        ?.value?.context?.findLocation();

      if (location) {
        editor?.scrollTo(location.start.offset);
      }
    }

    function focusArrowEvent(
      event: ArrowEvent,
      pathTree: PathTree,
      focused: SqValuePath
    ) {
      const node = pathTree.nodes.get(pathAsString(focused));
      switch (event) {
        case "ArrowDown": {
          const newItem = node?.children[0];
          if (newItem) {
            setSelected(newItem.fullPath);
          }
          break;
        }
        case "ArrowUp": {
          const newItem = node?.parent;
          if (newItem) {
            if (newItem.isRoot()) {
              setFocused(undefined);
            } else {
              setFocused(newItem.fullPath);
              setSelected(newItem.fullPath);
              scrollToPath(newItem.fullPath);
            }
          }
          break;
        }
        case "ArrowLeft": {
          const newItem = node?.prevSibling();
          if (newItem) {
            setFocused(newItem.fullPath);
            setSelected(newItem.fullPath);
            scrollToPath(newItem.fullPath);
          }
          break;
        }
        case "ArrowRight": {
          const newItem = node?.nextSibling();
          if (newItem) {
            setFocused(newItem.fullPath);
            setSelected(newItem.fullPath);
            scrollToPath(newItem.fullPath);
          }
          break;
        }
        case "Enter": {
          setFocused(undefined);
          break;
        }
      }
    }

    function selectedUnfocusedArrowEvent(
      event: ArrowEvent,
      pathTree: PathTree,
      selected: SqValuePath
    ) {
      const node = pathTree.nodes.get(pathAsString(selected));
      switch (event) {
        case "ArrowDown": {
          const newItem = node?.next();
          if (newItem) {
            const newPath = newItem.value.context.path;
            setSelected(newPath);
            scrollToPath(newPath);
            if (!itemStore.isInView(newPath)) {
              itemStore.scrollToPath(newPath);
            }
          }
          break;
        }
        case "ArrowUp": {
          const newItem = node?.prev();
          if (newItem) {
            const newPath = newItem.value.context.path;
            setSelected(newPath);
            scrollToPath(newPath);
            if (!itemStore.isInView(newPath)) {
              itemStore.scrollToPath(newPath);
            }
          }
          break;
        }
        case "ArrowLeft": {
          const newItem = node?.parent;
          newItem && !newItem.isRoot() && setSelected(newItem.fullPath);
          break;
        }
        case "ArrowRight": {
          itemStore.setState(selected, (state) => ({
            ...state,
            collapsed: !state?.collapsed,
          }));
          if (!itemStore.isInView(selected)) {
            itemStore.scrollToPath(selected);
          }
          itemStore.forceUpdate(selected);
          break;
        }
        case "Enter": {
          setFocused(selected);
          break;
        }
      }
    }

    const handle: SquiggleViewerHandle = {
      viewValuePath(path: SqValuePath) {
        setSelected(path);
        itemStore.scrollToPath(path);
      },
      onKeyPress(stroke: string) {
        const arrowEvent = isArrowEvent(stroke) ? stroke : undefined;

        if (arrowEvent && pathTree) {
          if (focused && selected && focused === selected) {
            focusArrowEvent(arrowEvent, pathTree, focused);
          } else if (selected) {
            selectedUnfocusedArrowEvent(arrowEvent, pathTree, selected);
          }
        }
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
          selected,
          setSelected,
          pathTree,
          setPathTree,
          itemStore,
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
