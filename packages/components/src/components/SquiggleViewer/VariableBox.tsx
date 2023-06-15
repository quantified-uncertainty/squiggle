import React, { useContext, useReducer } from "react";

import { SqValue } from "@quri/squiggle-lang";
import { TriangleIcon } from "@quri/ui";

import {
  LocalItemSettings,
  locationToShortName,
  MergedItemSettings,
} from "./utils.js";
import { ViewerContext } from "./ViewerContext.js";

type SettingsMenuParams = {
  onChange: () => void; // used to notify VariableBox that settings have changed, so that VariableBox could re-render itself
};

type VariableBoxProps = {
  value: SqValue;
  heading: string;
  preview?: React.ReactNode;
  renderSettingsMenu?: (params: SettingsMenuParams) => React.ReactNode;
  children: (settings: MergedItemSettings) => React.ReactNode;
};

export const SQTypeWithCount = ({
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
  preview,
  renderSettingsMenu,
  children,
}) => {
  const { setSettings, getSettings, getMergedSettings } =
    useContext(ViewerContext);

  // Since ViewerContext doesn't keep the actual settings, VariableBox won't rerender when setSettings is called.
  // So we use `forceUpdate` to force rerendering.
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  if (!location) {
    throw new Error("Can't display a locationless value");
  }

  const settings = getSettings(location);

  const setSettingsAndUpdate = (newSettings: LocalItemSettings) => {
    setSettings(location, newSettings);
    forceUpdate();
  };

  const toggleCollapsed = () => {
    setSettingsAndUpdate({ ...settings, collapsed: !settings.collapsed });
  };

  const name = locationToShortName(location);

  return (
    <div>
      {name === undefined ? null : (
        <header className="flex justify-between hover:bg-stone-100 rounded-md">
          <div className="inline-flex items-center">
            <span
              className="cursor-pointer p-1 mr-1 text-stone-300 hover:text-slate-700"
              onClick={toggleCollapsed}
            >
              <TriangleIcon
                size={10}
                className={settings.collapsed ? "rotate-90" : "rotate-180"}
              />
            </span>
            <span className="text-stone-800 font-mono text-sm">{name}</span>
            {preview && <div className="ml-2">{preview}</div>}
          </div>
          <div className="inline-flex space-x-1">
            {!settings.collapsed && (
              <div className="text-stone-400 hover:text-stone-600 text-sm">
                {heading}
              </div>
            )}
            {!settings.collapsed && renderSettingsMenu
              ? renderSettingsMenu({ onChange: forceUpdate })
              : null}
          </div>
        </header>
      )}
      {settings.collapsed ? null : (
        <div className="flex w-full">
          {location.path.items.length ? (
            <div
              className="flex group cursor-pointer"
              onClick={toggleCollapsed}
            >
              <div className="p-1" />
              <div className="border-l border-stone-200 group-hover:border-stone-500 w-2" />
            </div>
          ) : null}
          <div className="grow">{children(getMergedSettings(location))}</div>
        </div>
      )}
    </div>
  );
};
