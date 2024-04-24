import clsx from "clsx";
import { FC } from "react";

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  DropdownMenuHeader,
} from "@quri/ui";

import { SqOutputResult } from "../../../../squiggle-lang/src/public/types.js";
import { SelectableViewerTab, ViewerTab } from "../../lib/utility.js";
import { ToolbarItem } from "../ui/PanelWithToolbar/ToolbarItem.js";

const MenuItemTitle: FC<{ title: string; type: string | null }> = ({
  title,
  type,
}) => {
  const isEmpty = type === null;
  return (
    <div className="flex justify-between">
      <span className={clsx(isEmpty && "text-gray-400")}>{title}</span>
      {isEmpty ? (
        <span className="text-gray-300">Empty</span>
      ) : (
        <span className="text-gray-400">{type}</span>
      )}
    </div>
  );
};

function viewerTabTitle(mode: ViewerTab): string {
  if (typeof mode === "object" && mode.tag === "CustomVisibleRootPath") {
    return "Custom Path"; // Not used yet, as header is not shown yet when this mode is used.
  } else {
    return mode as string;
  }
}

type Props = {
  viewerTab: ViewerTab;
  setViewerTab: (viewerTab: ViewerTab) => void;
  outputResult: SqOutputResult;
  shownTabs: SelectableViewerTab[];
};

export const ViewerMenu: FC<Props> = ({
  viewerTab,
  setViewerTab,
  outputResult,
  shownTabs,
}) => {
  const hasResult = outputResult.ok && outputResult.value.result.tag !== "Void";
  const variablesCount = outputResult.ok
    ? outputResult.value.bindings.size()
    : 0;
  const importsCount = outputResult.ok ? outputResult.value.imports.size() : 0;
  const exportsCount = outputResult.ok ? outputResult.value.exports.size() : 0;

  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          {shownTabs.map((tab) => {
            const getType = () => {
              switch (tab) {
                case "Imports":
                  return importsCount ? `{}${importsCount}` : null;
                case "Variables":
                  return variablesCount ? `{}${variablesCount}` : null;
                case "Exports":
                  return exportsCount ? `{}${exportsCount}` : null;
                case "Result":
                  return hasResult ? "" : null;
                default:
                  return null;
              }
            };
            const viewerName = () => {
              switch (tab) {
                case "Imports":
                  return "Imports";
                case "Variables":
                  return "Local Variables";
                case "Exports":
                  return "Exported Variables";
                case "Result":
                  return "Final Result";
                default:
                  return "";
              }
            };
            return (
              tab !== "AST" && (
                <DropdownMenuActionItem
                  key={tab}
                  title={
                    <MenuItemTitle title={viewerName()} type={getType()} />
                  }
                  onClick={() => {
                    setViewerTab(tab);
                    close();
                  }}
                />
              )
            );
          })}
          <DropdownMenuHeader>Debugging</DropdownMenuHeader>
          <DropdownMenuActionItem
            title={<MenuItemTitle title="AST" type="" />}
            onClick={() => {
              setViewerTab("AST");
              close();
            }}
          />
        </DropdownMenu>
      )}
    >
      <ToolbarItem showDropdownArrow>{viewerTabTitle(viewerTab)}</ToolbarItem>
    </Dropdown>
  );
};
