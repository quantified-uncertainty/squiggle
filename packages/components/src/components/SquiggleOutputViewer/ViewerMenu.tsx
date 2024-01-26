import clsx from "clsx";
import { FC } from "react";

import {
  Button,
  CodeBracketIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  DropdownMenuHeader,
  TriangleIcon,
} from "@quri/ui";

import { SqOutputResult } from "../../../../squiggle-lang/src/public/types.js";
import { ViewerMode } from "../../lib/utility.js";

const MenuItemTitle: FC<{ title: string; type: string | null }> = ({
  title,
  type,
}) => {
  const isEmpty = type === null;
  return (
    <div className="flex justify-between">
      <span className={clsx(isEmpty && "text-slate-400")}>{title}</span>
      {isEmpty ? (
        <span className="text-slate-300">Empty</span>
      ) : (
        <span className="text-blue-800">{type}</span>
      )}
    </div>
  );
};

type Props = {
  mode: ViewerMode;
  setMode: (mode: ViewerMode) => void;
  output: SqOutputResult;
};

export const ViewerMenu: FC<Props> = ({ mode, setMode, output }) => {
  const hasResult = output.ok && output.value.result.tag !== "Void";
  const variablesCount = output.ok ? output.value.bindings.size() : 0;
  const importsCount = output.ok ? output.value.imports.size() : 0;
  const exportsCount = output.ok ? output.value.exports.size() : 0;

  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          {Boolean(importsCount) && (
            <DropdownMenuActionItem
              icon={CodeBracketIcon}
              title={
                <MenuItemTitle
                  title="Imports"
                  type={importsCount ? `{}${importsCount}` : null}
                />
              }
              onClick={() => {
                setMode("Imports");
                close();
              }}
            />
          )}
          {Boolean(variablesCount) && (
            <DropdownMenuActionItem
              icon={CodeBracketIcon}
              title={
                <MenuItemTitle
                  title="Variables"
                  type={variablesCount ? `{}${variablesCount}` : null}
                />
              }
              onClick={() => {
                setMode("Variables");
                close();
              }}
            />
          )}
          {Boolean(exportsCount) && (
            <DropdownMenuActionItem
              icon={CodeBracketIcon}
              title={
                <MenuItemTitle
                  title="Exports"
                  type={exportsCount ? `{}${exportsCount}` : null}
                />
              }
              onClick={() => {
                setMode("Exports");
                close();
              }}
            />
          )}
          <DropdownMenuActionItem
            icon={CodeBracketIcon}
            title={
              <MenuItemTitle title="Result" type={hasResult ? "" : null} />
            }
            onClick={() => {
              setMode("Result");
              close();
            }}
          />
          <DropdownMenuHeader>Debugging</DropdownMenuHeader>
          <DropdownMenuActionItem
            icon={CodeBracketIcon}
            title={<MenuItemTitle title="AST" type="" />}
            onClick={() => {
              setMode("AST");
              close();
            }}
          />
        </DropdownMenu>
      )}
    >
      <Button size="small">
        <div className="flex items-center space-x-1.5">
          <span>{mode}</span>
          <TriangleIcon className="rotate-180 text-slate-400" size={10} />
        </div>
      </Button>
    </Dropdown>
  );
};
