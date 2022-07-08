import React, { useContext, useState } from "react";
import { Tooltip } from "../ui/Tooltip";
import { ViewerContext } from "./ViewerContext";

interface VariableBoxProps {
  path: string[];
  heading: string;
  children: React.ReactNode;
}

export const VariableBox: React.FC<VariableBoxProps> = ({
  path,
  heading = "Error",
  children,
}) => {
  const { setSettings, getSettings } = useContext(ViewerContext);
  const [isCollapsed, setIsCollapsed] = useState(
    () => getSettings(path).collapsed
  );

  const toggleCollapsed = () => {
    setSettings(path, {
      collapsed: !isCollapsed,
    });
    setIsCollapsed(!isCollapsed);
  };

  const isTopLevel = path.length === 0;
  const name = isTopLevel ? "" : path[path.length - 1];

  return (
    <div>
      <div>
        {isTopLevel ? null : (
          <header
            className="inline-flex space-x-1 text-slate-500 font-mono text-sm cursor-pointer"
            onClick={toggleCollapsed}
          >
            <Tooltip text={heading}>
              <span>{name}:</span>
            </Tooltip>
            {isCollapsed ? (
              <span className="bg-slate-200 rounded p-0.5 font-xs">...</span>
            ) : null}
          </header>
        )}
        {isCollapsed ? null : (
          <div className="flex w-full">
            {path.length ? (
              <div
                className="border-l-2 border-slate-200 hover:border-green-600 w-4 cursor-pointer"
                onClick={toggleCollapsed}
              ></div>
            ) : null}
            <div className="grow">{children}</div>
          </div>
        )}
      </div>
    </div>
  );
};
