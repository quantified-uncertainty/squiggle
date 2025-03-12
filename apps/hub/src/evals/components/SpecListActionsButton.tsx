"use client";
import { FC } from "react";

import { Cog8ToothIcon, Dropdown, DropdownMenu } from "@quri/ui";

import { EvaluateSpecListAction } from "./EvaluateSpecListAction";

type Props = {
  specListId: string;
  specListName: string;
};

export const SpecListActionsButton: FC<Props> = ({ specListId, specListName }) => {
  return (
    <Dropdown
      render={() => (
        <DropdownMenu>
          <EvaluateSpecListAction
            specListId={specListId}
            specListName={specListName}
          />
        </DropdownMenu>
      )}
    >
      <button className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
        Actions <span className="ml-1">▾</span>
      </button>
    </Dropdown>
  );
};