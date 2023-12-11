"use client";
import { FC, useState } from "react";

import { IconProps } from "../../icons/Icon.js";
import { useCloseDropdown } from "./DropdownContext.js";
import { DropdownMenuItemLayout } from "./DropdownMenuItemLayout.js";

type AsyncActionItemProps = {
  icon?: FC<IconProps>;
  title: string;
  onClick(): Promise<void>;
  // deprecated, this component will obtain the correct close automatically from dropdown context
  close?: () => void;
};

export const DropdownMenuAsyncActionItem: FC<AsyncActionItemProps> = ({
  title,
  icon,
  onClick,
}) => {
  const closeDropdown = useCloseDropdown();

  const [acting, setActing] = useState(false);
  const act = async () => {
    if (acting) {
      return;
    }
    setActing(true);
    await onClick();
    setActing(false);
    closeDropdown();
  };

  return (
    <div onClick={act}>
      <DropdownMenuItemLayout icon={icon} title={title} acting={acting} />
    </div>
  );
};
