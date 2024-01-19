import clsx from "clsx";
import { FC } from "react";

import {
  Button,
  CodeBracketIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  TriangleIcon,
} from "@quri/ui";

import { SquiggleOutput } from "../../lib/hooks/useSquiggle.js";
import {
  getResultExports,
  getResultImports,
  getResultValue,
  getResultVariables,
} from "../../lib/utility.js";
import { ViewerMode } from "./index.js";

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
  output: SquiggleOutput;
};

export const ViewerMenu: FC<Props> = ({ mode, setMode, output }) => {
  const resultItem = getResultValue(output);
  const resultExports = getResultExports(output);
  const resultVariables = getResultVariables(output);
  const resultImports = getResultImports(output);

  const hasResult = Boolean(resultItem?.ok);
  const variablesCount = resultVariables?.ok
    ? resultVariables.value.value.entries().length
    : 0;
  const importsCount = resultImports?.ok
    ? resultImports.value.value.entries().length
    : 0;
  const exportsCount = resultExports?.ok
    ? resultExports.value.value.entries().length
    : 0;

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
