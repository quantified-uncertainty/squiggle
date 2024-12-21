"use client";
import { FC, ReactNode, useState } from "react";

import { useCloseDropdown } from "./DropdownContext.js";
import { DropdownMenuActionItem } from "./DropdownMenuActionItem.js";
import { ItemLayoutProps } from "./DropdownMenuItemLayout.js";

type Props = ItemLayoutProps & {
  render: ({ close }: { close: () => void }) => ReactNode;
};

/*
 * This component doesn't close the dropdown when modal is displayed.
 * Instead, you should close the dropdown manually by passing `useCloseDropdown()` result to Modal's `close` prop, or by using `close` prop from `render` function.
 */
export const DropdownMenuModalActionItem: FC<Props> = ({
  title,
  icon,
  render,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeDropdown = useCloseDropdown();

  return (
    <>
      <DropdownMenuActionItem
        title={title}
        onClick={() => setIsOpen(true)}
        icon={icon}
      />
      {isOpen && render({ close: closeDropdown })}
    </>
  );
};
