"use client";
import { FC } from "react";

import { Button, Dropdown, DropdownMenu } from "@quri/ui";

import { EvaluateSpecListAction } from "./EvaluateSpecListAction";

type Props = {
  specListId: string;
  specListName: string;
};

export const SpecListActionsButton: FC<Props> = ({
  specListId,
  specListName,
}) => {
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
      <Button>Actions...</Button>
    </Dropdown>
  );
};
