"use client";
import { FC, ReactNode, useState } from "react";

import { DropdownMenuActionItem } from "./DropdownMenuActionItem.js";
import { ItemLayoutProps } from "./DropdownMenuItemLayout.js";

type Props = ItemLayoutProps & {
  render(): ReactNode;
};

/*
 * This component doesn't close the dropdown when modal is displayed.
 * Instead, you should close the dropdown manually by passing `useCloseDropdown()` result to Modal's `close` prop.
 */
export const DropdownMenuModalActionItem: FC<Props> = ({
  title,
  icon,
  render,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <DropdownMenuActionItem
        title={title}
        onClick={() => setIsOpen(true)}
        icon={icon}
      />
      {isOpen && render()}
    </>
  );
};
