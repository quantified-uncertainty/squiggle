import React, { useContext, useReducer } from "react";
import { Tooltip } from "../ui/Tooltip";
import { LocalItemSettings, MergedItemSettings } from "./utils";
import { ViewerContext } from "./ViewerContext";

type SettingsMenuParams = {
  onChange: () => void; // used to notify VariableBox that settings have changed, so that VariableBox could re-render itself
};

type VariableBoxProps = {
  path: string[];
  heading: string;
  renderSettingsMenu?: (params: SettingsMenuParams) => React.ReactNode;
  children: (settings: MergedItemSettings) => React.ReactNode;
};

export const VariableBox: React.FC<VariableBoxProps> = ({
  path,
  heading = "Error",
  renderSettingsMenu,
  children,
}) => {
  const { setSettings, getSettings, getMergedSettings } =
    useContext(ViewerContext);

  // Since ViewerContext doesn't keep the actual settings, VariableBox won't rerender when setSettings is called.
  // So we use `forceUpdate` to force rerendering.
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);

  const settings = getSettings(path);

  const setSettingsAndUpdate = (newSettings: LocalItemSettings) => {
    setSettings(path, newSettings);
    forceUpdate();
  };

  const toggleCollapsed = () => {
    setSettingsAndUpdate({ ...settings, collapsed: !settings.collapsed });
  };

  const isTopLevel = path.length === 0;
  const name = isTopLevel ? "Result" : path[path.length - 1];

  return (
    <div>
      <header className="inline-flex space-x-1">
        <Tooltip text={heading}>
          <span
            className="text-slate-500 font-mono text-sm cursor-pointer"
            onClick={toggleCollapsed}
          >
            {name}:
          </span>
        </Tooltip>
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
      {settings.collapsed ? null : (
        <div className="flex w-full">
          {path.length ? (
            <div
              className="border-l-2 border-slate-200 hover:border-indigo-600 w-4 cursor-pointer"
              onClick={toggleCollapsed}
            ></div>
          ) : null}
          <div className="grow">{children(getMergedSettings(path))}</div>
        </div>
      )}
    </div>
  );
};
