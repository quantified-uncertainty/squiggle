import React, { useContext, useReducer } from "react";

import { SqValue } from "@quri/squiggle-lang";
import { TextTooltip } from "@quri/ui";

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
  renderSettingsMenu?: (params: SettingsMenuParams) => React.ReactNode;
  children: (settings: MergedItemSettings) => React.ReactNode;
};

export const VariableBox: React.FC<VariableBoxProps> = ({
  value: { location },
  heading = "Error",
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
        <header className="inline-flex space-x-1">
          <TextTooltip text={heading}>
            <span
              className="text-slate-500 font-mono text-sm cursor-pointer"
              onClick={toggleCollapsed}
            >
              {name}:
            </span>
          </TextTooltip>
          {settings.collapsed ? (
            <span
              className="rounded p-0.5 bg-slate-200 text-slate-500 font-mono text-xs cursor-pointer"
              onClick={toggleCollapsed}
            >
              ...
            </span>
          ) : renderSettingsMenu ? (
            renderSettingsMenu({ onChange: forceUpdate })
          ) : null}
        </header>
      )}
      {settings.collapsed ? null : (
        <div className="flex w-full">
          {location.path.items.length ? (
            <div
              className="shrink-0 border-l-2 border-slate-200 hover:border-indigo-600 w-4 cursor-pointer"
              onClick={toggleCollapsed}
            ></div>
          ) : null}
          <div className="grow overflow-auto">
            {children(getMergedSettings(location))}
          </div>
        </div>
      )}
    </div>
  );
};
