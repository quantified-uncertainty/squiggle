"use client";
import { FC, Ref, useImperativeHandle, useState } from "react";

import {
  ButtonWithDropdown,
  CommentIcon,
  DropdownMenu,
  DropdownMenuActionItem,
} from "@quri/ui";

import { OnSubmit } from "./EditSquiggleSnippetModel";
import { SaveDialog } from "./SaveDialog";

export type SaveButtonHandle = {
  openSaveDialog: () => void;
};

type Props = {
  onSubmit: OnSubmit;
  disabled: boolean;
  unsaved: boolean;
  ref: Ref<SaveButtonHandle>;
};

export const SaveButton: FC<Props> = ({ onSubmit, disabled, unsaved, ref }) => {
  const [showDialog, setShowDialog] = useState(false);

  useImperativeHandle(ref, () => ({
    openSaveDialog: () => setShowDialog(true),
  }));

  return (
    <>
      {showDialog && (
        <SaveDialog onSubmit={onSubmit} close={() => setShowDialog(false)} />
      )}
      <ButtonWithDropdown
        theme={unsaved ? "primary" : "default"}
        size="small"
        onClick={onSubmit}
        disabled={disabled}
        renderDropdown={() => (
          <DropdownMenu>
            <DropdownMenuActionItem
              title="Save with comment..."
              icon={CommentIcon}
              onClick={() => setShowDialog(true)}
            />
          </DropdownMenu>
        )}
      >
        Save
      </ButtonWithDropdown>
    </>
  );
};
