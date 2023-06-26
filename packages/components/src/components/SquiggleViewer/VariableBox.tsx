import React, { FC, ReactNode, useEffect, useReducer } from "react";

import { SqValue } from "@quri/squiggle-lang";
import { TriangleIcon, CodeBracketIcon, TextTooltip } from "@quri/ui";

import {
  LocalItemSettings,
  pathToShortName,
  MergedItemSettings,
} from "./utils.js";
import {
  useFocus,
  useIsFocused,
  useSetSettings,
  useViewerContext,
} from "./ViewerProvider.js";
import { clsx } from "clsx";
import { SqValuePath } from "@quri/squiggle-lang";

type SettingsMenuParams = {
  // Used to notify VariableBox that settings have changed, so that VariableBox could re-render itself.
  onChange: () => void;
};

type VariableBoxProps = {
  value: SqValue;
  heading: string;
  preview?: ReactNode;
  renderSettingsMenu?: (params: SettingsMenuParams) => ReactNode;
  children: (settings: MergedItemSettings) => ReactNode;
};

export const SqTypeWithCount: FC<{
  type: string;
  count: number;
}> = ({ type, count }) => (
  <div className="text-sm text-stone-400 font-mono">
    {type}
    <span className="ml-0.5">{count}</span>
  </div>
);

export const VariableBox: FC<VariableBoxProps> = ({
  value,
  heading = "Error",
  preview,
  renderSettingsMenu,
  children,
}) => {
  const setSettings = useSetSettings();
  const focus = useFocus();
  const { editor, getSettings, getMergedSettings, dispatch } =
    useViewerContext();

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

  if (!path) {
    throw new Error("Can't display a pathless value");
  }

  const isFocused = path && useIsFocused(path);

  const settings = getSettings(path);

  const getAdjustedMergedSettings = (path: SqValuePath) => {
    const mergedSettings = getMergedSettings(path);
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

  const saveRef = (element: HTMLDivElement) => {
    dispatch({
      type: "REGISTER_ITEM_HANDLE",
      payload: {
        path: path,
        element,
      },
    });
  };

  useEffect(() => {
    return () => {
      dispatch({
        type: "UNREGISTER_ITEM_HANDLE",
        payload: {
          path: path,
        },
      });
    };
  }, []);

  const isCollapsed = isFocused ? false : settings.collapsed;
  const shouldShowTriangleToggle = !isFocused;
  const shouldShowLeftHeaderPreview = !isFocused && !!preview;
  const shouldShowRightHeaderString = Boolean(
    !settings.collapsed && path.items.length
  );
  const shouldShowRightHeaderFindInEditor = !isRoot;
  const showOpenedLeftSidebar = Boolean(
    !isCollapsed && path.items.length && !isFocused
  );
  const _focus = () => !isFocused && path.items.length && focus(path);

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
            {shouldShowTriangleToggle && (
              <span
                className="cursor-pointer p-1 mr-1 text-stone-300 hover:text-slate-700"
                onClick={toggleCollapsed}
              >
                <TriangleIcon
                  size={10}
                  className={isCollapsed ? "rotate-90" : "rotate-180"}
                />
              </span>
            )}
            <span
              className={clsx(
                "font-mono",
                isFocused
                  ? "text-md text-stone-900 ml-1"
                  : "text-sm text-stone-800 cursor-pointer hover:underline"
              )}
              onClick={_focus}
            >
              {name}
            </span>
            {shouldShowLeftHeaderPreview && (
              <div className="ml-2">{preview}</div>
            )}
            {shouldShowRightHeaderFindInEditor && (
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
            )}
          </div>
          <div className="inline-flex space-x-1">
            {shouldShowRightHeaderString && (
              <div className="text-stone-400 group-hover:text-stone-600 text-sm">
                {heading}
              </div>
            )}
            {!settings.collapsed &&
              renderSettingsMenu?.({ onChange: forceUpdate })}
          </div>
        </header>
      )}
      {!isCollapsed && (
        <div className="flex w-full">
          {showOpenedLeftSidebar && (
            <div
              className="flex group cursor-pointer"
              onClick={toggleCollapsed}
            >
              <div className="p-1" />
              <div className="border-l border-stone-200 group-hover:border-stone-500 w-2" />
            </div>
          )}
          {isFocused && <div className="w-2" />}
          <div className="grow">
            {children(getAdjustedMergedSettings(path))}
          </div>
        </div>
      )}
    </div>
  );
};
