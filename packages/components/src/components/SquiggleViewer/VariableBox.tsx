import { FC, ReactNode, useCallback, useEffect, useReducer } from "react";

import { SqValue } from "@quri/squiggle-lang";
import { TriangleIcon, CodeBracketIcon, TextTooltip } from "@quri/ui";

import {
  LocalItemSettings,
  getChildrenValues,
  MergedItemSettings,
  pathToShortName,
  pathAsString,
} from "./utils.js";
import {
  useFocus,
  useIsFocused,
  useSetSettings,
  useCollapseChildren,
  useViewerContext,
} from "./ViewerProvider.js";
import { clsx } from "clsx";
import { SqValuePath } from "@quri/squiggle-lang";

type SettingsMenuParams = {
  // Used to notify VariableBox that settings have changed, so that VariableBox could re-render itself.
  onChange: () => void;
};

export type VariableBoxProps = {
  value: SqValue;
  heading?: string;
  preview?: ReactNode;
  renderSettingsMenu?: (params: SettingsMenuParams) => ReactNode;
  children: (settings: MergedItemSettings) => ReactNode;
};

export const SqTypeWithCount: FC<{
  type: string;
  count: number;
}> = ({ type, count }) => (
  <div>
    {type}
    <span className="ml-0.5">{count}</span>
  </div>
);

//I'm unsure what good defaults will be here. These are heuristics.
const makeInitialSettings = (childrenLength: number, isRoot: boolean) => ({
  beCollapsed: !isRoot && childrenLength > 5,
  collapseChildren: childrenLength > 10,
});

export const VariableBox: FC<VariableBoxProps> = ({
  value,
  heading = "Error",
  preview,
  renderSettingsMenu,
  children,
}) => {
  const setSettings = useSetSettings();
  const collapseChildren = useCollapseChildren();
  const focus = useFocus();
  const { editor, getSettings, getMergedSettings, dispatch } =
    useViewerContext();
  const isFocused = useIsFocused(value.path);

  const findInEditor = () => {
    const locationR = value.path?.findLocation();
    if (!locationR?.ok) {
      return;
    }
    editor?.scrollTo(locationR.value.start.offset);
  };

  // Since `ViewerContext` doesn't store settings, `VariableBox` won't rerender when `setSettings` is called.
  // So we use `forceUpdate` to force rerendering.
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const { path } = value;
  const isRoot = Boolean(path?.isRoot());
  const childrenElements = getChildrenValues(value);
  const initialSettings = makeInitialSettings(childrenElements.length, isRoot);

  if (!path) {
    throw new Error("Can't display pathless value");
  }

  if (initialSettings.collapseChildren) {
    collapseChildren(value);
  }

  const defaults: LocalItemSettings = {
    collapsed: initialSettings.beCollapsed,
  };
  const settings = getSettings({ path, defaults });

  const getAdjustedMergedSettings = (path: SqValuePath) => {
    const mergedSettings = getMergedSettings({ path });
    const { chartHeight } = mergedSettings;
    return {
      ...mergedSettings,
      chartHeight: isFocused ? chartHeight * 3 : chartHeight,
    };
  };

  const setSettingsAndUpdate = (newSettings: LocalItemSettings) => {
    setSettings(path, newSettings);
    forceUpdate();
  };

  const toggleCollapsed = () => {
    setSettingsAndUpdate({ ...settings, collapsed: !settings.collapsed });
  };

  const name = pathToShortName(path);

  // should be callback to not fire on each render
  const saveRef = useCallback(
    (element: HTMLDivElement) => {
      dispatch({
        type: "REGISTER_ITEM_HANDLE",
        payload: { path, element },
      });
    },
    [dispatch, path]
  );

  useEffect(() => {
    // This code is a bit risky, because I'm not sure about the order in which ref callbacks and effect cleanups fire.
    // But it works in practice.
    // We should switch to ref cleanups after https://github.com/facebook/react/pull/25686 is released.
    return () => {
      dispatch({
        type: "UNREGISTER_ITEM_HANDLE",
        payload: { path },
      });
    };
  }, [dispatch, path]);

  const hasBodyContent = Boolean(path.items.length);
  const isOpen = isFocused || !settings.collapsed;
  const _focus = () => !isFocused && hasBodyContent && focus(path);

  const triangleToggle = () => (
    <div
      className="cursor-pointer p-1 mr-1 text-stone-300 hover:text-slate-700"
      onClick={toggleCollapsed}
    >
      <TriangleIcon size={10} className={isOpen ? "rotate-180" : "rotate-90"} />
    </div>
  );
  const headerName = (
    <div
      className={clsx(
        "font-mono",
        isFocused
          ? "text-md text-stone-900 ml-1"
          : "text-sm text-stone-800 cursor-pointer hover:underline"
      )}
      onClick={_focus}
    >
      {name}
    </div>
  );
  const headerPreview = () =>
    !!preview && (
      <div className="ml-2 text-sm text-stone-400 font-mono">{preview}</div>
    );
  const headerFindInEditorButton = () => (
    <div className="ml-3">
      <TextTooltip text="Show in Editor" placement="bottom">
        <span>
          <CodeBracketIcon
            className={`items-center h-4 w-4 cursor-pointer text-stone-200  group-hover:text-stone-400 hover:!text-stone-800 transition`}
            onClick={() => findInEditor()}
          />
        </span>
      </TextTooltip>
    </div>
  );
  const headerString = () => (
    <div className="text-stone-400 group-hover:text-stone-600 text-sm transition">
      {heading}
    </div>
  );
  const headerSettingsButton = () =>
    renderSettingsMenu?.({ onChange: forceUpdate });
  const leftCollapseBorder = () =>
    hasBodyContent && (
      <div className="flex group cursor-pointer" onClick={toggleCollapsed}>
        <div className="p-1" />
        <div className="border-l border-stone-200 group-hover:border-stone-500 w-2" />
      </div>
    );

  return (
    <div ref={saveRef}>
      {name === undefined ? null : (
        <header
          className={clsx(
            "flex justify-between group",
            isFocused ? "mb-2" : "hover:bg-stone-100 rounded-md"
          )}
        >
          <div className="inline-flex items-center">
            {!isFocused && triangleToggle()}
            {headerName}
            {!isFocused && headerPreview()}
            {!isRoot && headerFindInEditorButton()}
          </div>
          <div className="inline-flex space-x-1">
            {isOpen && headerString()}
            {isOpen && headerSettingsButton()}
          </div>
        </header>
      )}
      {isOpen && (
        <div className="flex w-full">
          {!isFocused && leftCollapseBorder()}
          {isFocused && <div className="w-2" />}
          <div className="grow">
            {children(getAdjustedMergedSettings(path))}
          </div>
        </div>
      )}
    </div>
  );
};
