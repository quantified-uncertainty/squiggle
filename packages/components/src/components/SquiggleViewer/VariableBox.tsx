import React, { useContext, useReducer } from "react";
import { Tooltip } from "../ui/Tooltip";
import { LocalItemSettings, MergedItemSettings } from "./utils";
import { ViewerContext } from "./ViewerContext";

type DropdownMenuParams = {
  settings: LocalItemSettings;
  setSettings: (value: LocalItemSettings) => void;
};

type VariableBoxProps = {
  path: string[];
  heading: string;
  dropdownMenu?: (params: DropdownMenuParams) => React.ReactNode;
  children: (settings: MergedItemSettings) => React.ReactNode;
};

export const VariableBox: React.FC<VariableBoxProps> = ({
  path,
  heading = "Error",
  dropdownMenu,
  children,
}) => {
  const { setSettings, getSettings, getMergedSettings } =
    useContext(ViewerContext);
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
        ) : dropdownMenu ? (
          dropdownMenu({ settings, setSettings: setSettingsAndUpdate })
        ) : null}
      </header>
      {settings.collapsed ? null : (
        <div className="flex w-full">
          {path.length ? (
            <div
              className="border-l-2 border-slate-200 hover:border-green-600 w-4 cursor-pointer"
              onClick={toggleCollapsed}
            ></div>
          ) : null}
          <div className="grow">{children(getMergedSettings(path))}</div>
        </div>
      )}
    </div>
  );
};
