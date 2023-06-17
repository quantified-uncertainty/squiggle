import React, { useReducer } from "react";

import { SqValue } from "@quri/squiggle-lang";
import { FocusIcon, TriangleIcon } from "@quri/ui";

import {
  LocalItemSettings,
  locationToShortName,
  MergedItemSettings,
} from "./utils.js";
import {
  useFocus,
  useSetSettings,
  useViewerContext,
} from "./ViewerProvider.js";
import { clsx } from "clsx";

type SettingsMenuParams = {
  // Used to notify VariableBox that settings have changed, so that VariableBox could re-render itself.
  onChange: () => void;
};

type VariableBoxProps = {
  value: SqValue;
  heading: string;
  isFocused?: boolean;
  preview?: React.ReactNode;
  renderSettingsMenu?: (params: SettingsMenuParams) => React.ReactNode;
  children: (settings: MergedItemSettings) => React.ReactNode;
};

export const SqTypeWithCount = ({
  type,
  count,
}: {
  type: string;
  count: number;
}) => (
  <div className="text-sm text-stone-400 font-mono">
    {type}
    <span className="ml-0.5">{count}</span>
  </div>
);

export const VariableBox: React.FC<VariableBoxProps> = ({
  value: { location },
  heading = "Error",
  isFocused = false,
  preview,
  renderSettingsMenu,
  children,
}) => {
  const setSettings = useSetSettings();
  const focus = useFocus();
  const { getSettings, getMergedSettings } = useViewerContext();

  // Since `ViewerContext` doesn't store settings, `VariableBox` won't rerender when `setSettings` is called.
  // So we use `forceUpdate` to force rerendering.
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  if (!location) {
    throw new Error("Can't display a locationless value");
  }

  const settings = getSettings(location);
  // const fooSettings = {...settings, chartHeight: settings.chartHeight + 100}

  const setSettingsAndUpdate = (newSettings: LocalItemSettings) => {
    setSettings(location, newSettings);
    forceUpdate();
  };

  const toggleCollapsed = () => {
    setSettingsAndUpdate({ ...settings, collapsed: !settings.collapsed });
  };

  const name = locationToShortName(location);
  const adjustSettings = (settings) => ({
    ...settings,
    chartHeight: isFocused ? settings.chartHeight * 3 : settings.chartHeight,
  });

  const isCollapsed = isFocused ? false : settings.collapsed;
  return (
    <div>
      {name === undefined ? null : (
        <header
          className={clsx(
            "flex justify-between",
            isFocused ? "mb-2" : "hover:bg-stone-100 rounded-md"
          )}
        >
          <div className="inline-flex items-center">
            {!isFocused && (
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
                  : "text-sm text-stone-800"
              )}
            >
              {name}
            </span>
            {!isFocused && !!preview && <div className="ml-2">{preview}</div>}
          </div>
          <div className="inline-flex space-x-1">
            {Boolean(!isCollapsed && location.path.items.length) && (
              <div className="text-stone-400 hover:text-stone-600 text-sm">
                {heading}
              </div>
            )}
            {location.path.items.length && !isFocused ? (
              <FocusIcon
                className="h-5 w-5 cursor-pointer text-stone-200 hover:text-stone-500"
                onClick={() => focus(location)}
              />
            ) : null}
            {!isCollapsed && renderSettingsMenu?.({ onChange: forceUpdate })}
          </div>
        </header>
      )}
      {isCollapsed ? null : (
        <div className="flex w-full">
          {location.path.items.length && !isFocused ? (
            <div
              className="flex group cursor-pointer"
              onClick={toggleCollapsed}
            >
              <div className="p-1" />
              <div className="border-l border-stone-200 group-hover:border-stone-500 w-2" />
            </div>
          ) : null}
          {isFocused && <div className="w-2" />}
          <div className="grow">
            {children(adjustSettings(getMergedSettings(location)))}
          </div>
        </div>
      )}
    </div>
  );
};
